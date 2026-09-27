"""
review_orchestrator.py
-----------------------
Orchestrates the full AI PR review pipeline:

  1. Fetch PR diff from GitHub API
  2. Parse diff → position map (diff_mapper)
  3. Send to LLM → structured ReviewResult (llm_reviewer)
  4. Map LLM comment line numbers → GitHub diff positions
  5. Post inline review comments + summary via GitHub API

Called from views.py when a pull_request webhook event arrives.
"""

import logging
import requests
from typing import Optional

from .github_auth import get_installation_token
from .diff_mapper import parse_diff, get_position_for_new_line
from .llm_reviewer import (
    run_llm_review,
    format_comment_body,
    format_pr_summary,
    ReviewResult,
)

logger = logging.getLogger(__name__)

GITHUB_API = "https://api.github.com"


# ─────────────────────────────────────────────────────────────────────────────
# GitHub API helpers
# ─────────────────────────────────────────────────────────────────────────────

def _gh_headers(token: str) -> dict:
    return {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }


def _fetch_pr_diff(token: str, repo_full_name: str, pr_number: int) -> str:
    """
    Download the raw unified diff for a PR.
    Uses the special Accept header that returns raw diff format.
    """
    url = f"{GITHUB_API}/repos/{repo_full_name}/pulls/{pr_number}"
    headers = _gh_headers(token)
    headers["Accept"] = "application/vnd.github.diff"

    resp = requests.get(url, headers=headers, timeout=30)
    resp.raise_for_status()
    return resp.text


def _fetch_pr_details(token: str, repo_full_name: str, pr_number: int) -> dict:
    """Fetch PR metadata (title, body, head/base branch, changed files)."""
    url = f"{GITHUB_API}/repos/{repo_full_name}/pulls/{pr_number}"
    resp = requests.get(url, headers=_gh_headers(token), timeout=15)
    resp.raise_for_status()
    return resp.json()


def _fetch_changed_files(token: str, repo_full_name: str, pr_number: int) -> list[str]:
    """Return list of changed file paths in the PR."""
    url = f"{GITHUB_API}/repos/{repo_full_name}/pulls/{pr_number}/files"
    resp = requests.get(url, headers=_gh_headers(token), timeout=15)
    resp.raise_for_status()
    return [f["filename"] for f in resp.json()]


def _post_review(
    token: str,
    repo_full_name: str,
    pr_number: int,
    commit_id: str,
    review_body: str,
    comments: list[dict],
    event: str,   # "APPROVE" | "REQUEST_CHANGES" | "COMMENT"
) -> dict:
    """
    Submit a full PR review with inline comments in a single API call.

    Using the reviews endpoint batches all comments atomically — better
    than posting individual comments separately.
    """
    url = f"{GITHUB_API}/repos/{repo_full_name}/pulls/{pr_number}/reviews"
    payload = {
        "commit_id": commit_id,
        "body": review_body,
        "event": event,
        "comments": comments,
    }
    resp = requests.post(url, headers=_gh_headers(token), json=payload, timeout=30)
    resp.raise_for_status()
    return resp.json()


# ─────────────────────────────────────────────────────────────────────────────
# Verdict → GitHub event mapping
# ─────────────────────────────────────────────────────────────────────────────

_VERDICT_TO_EVENT = {
    "approve":         "APPROVE",
    "request_changes": "REQUEST_CHANGES",
    "comment":         "COMMENT",
}


# ─────────────────────────────────────────────────────────────────────────────
# Main orchestrator
# ─────────────────────────────────────────────────────────────────────────────

def run_pr_review(
    installation_id: int,
    repo_full_name: str,
    pr_number: int,
    commit_id: str,
    pr_title: str,
    pr_description: str,
    base_branch: str,
    head_branch: str,
    dry_run: bool = False,
) -> dict:
    """
    Full AI PR review pipeline.

    Args:
        installation_id : GitHub App installation ID (from webhook payload)
        repo_full_name  : e.g. "owner/my-repo"
        pr_number       : PR number (integer)
        commit_id       : HEAD commit SHA of the PR (from webhook payload)
        pr_title        : PR title
        pr_description  : PR body/description
        base_branch     : Base branch name (e.g. "main")
        head_branch     : Head branch name (e.g. "feature/x")
        dry_run         : If True, runs the full pipeline but skips posting to GitHub.
                          Returns the ReviewResult dict instead.

    Returns:
        dict with review summary, verdict, comment count, and github_response.
    """
    logger.info(
        f"[PR Review] Starting review for {repo_full_name}#{pr_number} "
        f"(installation={installation_id})"
    )

    # ── Step 1: Authenticate ─────────────────────────────────────────────────
    token = get_installation_token(installation_id)

    # ── Step 2: Fetch diff and changed files ─────────────────────────────────
    logger.info(f"[PR Review] Fetching diff for {repo_full_name}#{pr_number}")
    raw_diff = _fetch_pr_diff(token, repo_full_name, pr_number)
    changed_files = _fetch_changed_files(token, repo_full_name, pr_number)

    logger.info(
        f"[PR Review] Diff size: {len(raw_diff)} chars | "
        f"Files changed: {len(changed_files)}"
    )

    # ── Step 3: Parse diff → position map ────────────────────────────────────
    file_maps = parse_diff(raw_diff)

    # ── Step 4: LLM Review ───────────────────────────────────────────────────
    logger.info(f"[PR Review] Sending to LLM...")
    result: ReviewResult = run_llm_review(
        pr_title=pr_title,
        pr_description=pr_description,
        repo_name=repo_full_name,
        base_branch=base_branch,
        head_branch=head_branch,
        diff=raw_diff,
        changed_files=changed_files,
    )

    # ── Step 5: Map line numbers → diff positions ─────────────────────────────
    github_comments = []
    skipped_comments = 0

    for comment in result.comments:
        position = get_position_for_new_line(
            file_maps,
            comment.file,
            comment.line,
        )

        if position is None:
            logger.warning(
                f"[PR Review] No diff position for {comment.file}:{comment.line} "
                f"— skipping (line may not be in diff)"
            )
            skipped_comments += 1
            continue

        comment.diff_position = position
        github_comments.append({
            "path": comment.file,
            "position": position,
            "body": format_comment_body(comment),
        })

    logger.info(
        f"[PR Review] {len(github_comments)} comments will be posted "
        f"({skipped_comments} skipped — not in diff)"
    )

    # ── Step 6: Format PR review summary ─────────────────────────────────────
    review_body = format_pr_summary(result)
    github_event = _VERDICT_TO_EVENT.get(result.verdict, "COMMENT")

    # ── Step 7: Post to GitHub ────────────────────────────────────────────────
    if dry_run:
        logger.info("[PR Review] DRY RUN — skipping GitHub post")
        return {
            "dry_run": True,
            "verdict": result.verdict,
            "summary": result.summary,
            "comments_count": len(github_comments),
            "skipped_count": skipped_comments,
            "model_used": result.model_used,
            "review_body": review_body,
            "inline_comments": github_comments,
        }

    logger.info(f"[PR Review] Posting review to GitHub (event={github_event})")
    gh_response = _post_review(
        token=token,
        repo_full_name=repo_full_name,
        pr_number=pr_number,
        commit_id=commit_id,
        review_body=review_body,
        comments=github_comments,
        event=github_event,
    )

    logger.info(
        f"[PR Review] ✅ Review posted! review_id={gh_response.get('id')} "
        f"verdict={result.verdict} comments={len(github_comments)}"
    )

    return {
        "verdict": result.verdict,
        "summary": result.summary,
        "comments_count": len(github_comments),
        "skipped_count": skipped_comments,
        "model_used": result.model_used,
        "github_review_id": gh_response.get("id"),
        "github_review_url": gh_response.get("html_url"),
    }
