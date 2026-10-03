"""
llm_reviewer.py
---------------
LLM prompt design and structured JSON output for AI code review.

Uses Google Gemini (gemini-2.5-flash / gemini-1.5-flash free tier).
Returns a validated, structured ReviewResult object.

STRUCTURED OUTPUT CONTRACT
---------------------------
The LLM is instructed to respond with ONLY a JSON object matching this schema:

{
  "summary": "Overall review summary in 2-3 sentences.",
  "verdict": "approve" | "request_changes" | "comment",
  "comments": [
    {
      "file": "src/utils.py",
      "line": 42,               // line number in the NEW file (head)
      "severity": "critical" | "warning" | "suggestion" | "praise",
      "category": "bug" | "security" | "performance" | "style" | "logic" | "docs",
      "title": "Short title",
      "body": "Detailed explanation with code suggestion if relevant."
    }
  ]
}
"""

import json
import logging
import re
from dataclasses import dataclass, field
from typing import Optional

from decouple import config

try:
    from google import genai
    from google.genai import types
    GEMINI_AVAILABLE = True
except ImportError:
    genai = None
    types = None
    GEMINI_AVAILABLE = False

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────────────────────
# Config
# ─────────────────────────────────────────────────────────────────────────────

GEMINI_API_KEY = config('GEMINI_API_KEY', default='')
DEFAULT_MODEL = config('GEMINI_MODEL', default='gemini-2.5-flash')

MAX_DIFF_CHARS = 60_000   # Truncate very large diffs to stay within context
MAX_TOKENS = 4096


# ─────────────────────────────────────────────────────────────────────────────
# Structured output types
# ─────────────────────────────────────────────────────────────────────────────

@dataclass
class ReviewComment:
    file: str
    line: int                 # absolute line in new file
    severity: str             # critical | warning | suggestion | praise
    category: str             # bug | security | performance | style | logic | docs
    title: str
    body: str
    diff_position: Optional[int] = None   # filled in after diff_mapper lookup


@dataclass
class ReviewResult:
    summary: str
    verdict: str              # approve | request_changes | comment
    comments: list[ReviewComment] = field(default_factory=list)
    raw_response: str = ''    # full LLM text (for debugging)
    model_used: str = ''


# ─────────────────────────────────────────────────────────────────────────────
# Prompt templates
# ─────────────────────────────────────────────────────────────────────────────

SYSTEM_PROMPT = """\
You are an expert software engineer performing a thorough pull request code review.
Your goal is to identify real issues — bugs, security vulnerabilities, logic errors,
performance problems — and provide actionable, specific feedback.

RULES:
1. Only comment on code that is actually changed (lines present in the diff).
2. Be constructive and respectful. Praise good patterns when you see them.
3. For every comment, cite the exact filename and line number from the diff.
4. If no issues exist, say so honestly with verdict "approve".
5. You MUST respond with ONLY a valid JSON object — no prose, no markdown, no
   explanation outside the JSON. The JSON must match this exact schema:

{
  "summary": "<2-3 sentence overall review>",
  "verdict": "<approve|request_changes|comment>",
  "comments": [
    {
      "file": "<relative file path>",
      "line": <integer line number in new file>,
      "severity": "<critical|warning|suggestion|praise>",
      "category": "<bug|security|performance|style|logic|docs>",
      "title": "<short title, max 80 chars>",
      "body": "<detailed explanation, may include suggested fix>"
    }
  ]
}

Verdict rules:
- "approve"          → no significant issues found
- "request_changes"  → critical or warning issues that must be fixed
- "comment"          → suggestions only, approval not blocked
"""


def _build_user_prompt(
    pr_title: str,
    pr_description: str,
    repo_name: str,
    base_branch: str,
    head_branch: str,
    diff: str,
    changed_files: list[str],
    ast_summary: str = "",
) -> str:
    """Construct the user-turn prompt with all PR context.

    Args:
        ast_summary : Optional block of tree-sitter AST findings to inject
                      before the diff so the LLM can reference them.
    """

    # Truncate diff if too large
    if len(diff) > MAX_DIFF_CHARS:
        diff = diff[:MAX_DIFF_CHARS] + "\n\n[... diff truncated due to size ...]"

    files_list = "\n".join(f"  - {f}" for f in changed_files)

    # Optionally prepend the AST analysis block
    ast_block = f"\n{ast_summary}\n" if ast_summary else ""

    return f"""\
## Pull Request Details

**Repository:** {repo_name}
**PR Title:** {pr_title}
**Description:** {pr_description or "(no description provided)"}
**Base branch:** {base_branch}  →  **Head branch:** {head_branch}

## Changed Files
{files_list}
{ast_block}
## Unified Diff
```diff
{diff}
```

Please review the above diff and respond with the structured JSON review.
"""


# ─────────────────────────────────────────────────────────────────────────────
# JSON extraction helper
# ─────────────────────────────────────────────────────────────────────────────

def _extract_json(text: str) -> dict:
    """
    Robustly extract a JSON object from LLM output.
    Handles cases where the model wraps JSON in markdown code fences.
    """
    if not text:
        raise ValueError("Empty LLM response received")

    # Try direct parse first
    try:
        return json.loads(text.strip())
    except json.JSONDecodeError:
        pass

    # Strip markdown code fences
    fence_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', text, re.DOTALL)
    if fence_match:
        try:
            return json.loads(fence_match.group(1))
        except json.JSONDecodeError:
            pass

    # Find first { ... } block
    brace_match = re.search(r'\{.*\}', text, re.DOTALL)
    if brace_match:
        try:
            return json.loads(brace_match.group(0))
        except json.JSONDecodeError:
            pass

    raise ValueError(f"Could not parse JSON from LLM response:\n{text[:500]}")


# ─────────────────────────────────────────────────────────────────────────────
# Main review function
# ─────────────────────────────────────────────────────────────────────────────

def run_llm_review(
    pr_title: str,
    pr_description: str,
    repo_name: str,
    base_branch: str,
    head_branch: str,
    diff: str,
    changed_files: list[str],
    model: Optional[str] = None,
    ast_summary: str = "",
) -> ReviewResult:
    """
    Send the PR diff to Google Gemini and get back a structured ReviewResult.

    Args:
        pr_title        : Title of the pull request
        pr_description  : Body/description of the pull request
        repo_name       : e.g. "owner/my-repo"
        base_branch     : e.g. "main"
        head_branch     : e.g. "feature/my-feature"
        diff            : Raw unified diff string from GitHub API
        changed_files   : List of changed filenames
        model           : Override the default Gemini model
        ast_summary     : Pre-formatted tree-sitter findings block to inject
                          into the prompt (from ast_checker.format_ast_findings_for_prompt)

    Returns:
        ReviewResult with summary, verdict, and list of ReviewComment objects.

    Raises:
        ValueError  : If API key missing, google-genai not installed, or JSON parsing fails
        Exception   : On API call failure
    """
    if not GEMINI_AVAILABLE:
        raise ValueError(
            "google-genai package is not installed. Run: pip install google-genai"
        )

    if not GEMINI_API_KEY or GEMINI_API_KEY == "your_gemini_api_key_here":
        raise ValueError(
            "GEMINI_API_KEY is not set in .env. "
            "Get a free API key at https://aistudio.google.com/"
        )

    client = genai.Client(api_key=GEMINI_API_KEY)
    model_name = model or DEFAULT_MODEL

    user_prompt = _build_user_prompt(
        pr_title=pr_title,
        pr_description=pr_description,
        repo_name=repo_name,
        base_branch=base_branch,
        head_branch=head_branch,
        diff=diff,
        changed_files=changed_files,
        ast_summary=ast_summary,
    )

    logger.info(
        f"Sending PR '{pr_title}' to Gemini model {model_name} | "
        f"diff={len(diff)} chars | files={len(changed_files)}"
    )

    config_kwargs = {}
    if types is not None:
        config_kwargs["config"] = types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT,
            temperature=0.2,
            max_output_tokens=MAX_TOKENS,
            response_mime_type="application/json",
        )

    response = client.models.generate_content(
        model=model_name,
        contents=user_prompt,
        **config_kwargs
    )

    raw_text = response.text or ""
    logger.debug(f"LLM raw response ({len(raw_text)} chars): {raw_text[:300]}...")

    # Parse structured output
    data = _extract_json(raw_text)

    # Validate top-level keys
    summary = data.get("summary", "")
    verdict = data.get("verdict", "comment")
    raw_comments = data.get("comments", [])

    if verdict not in ("approve", "request_changes", "comment"):
        logger.warning(f"Unexpected verdict '{verdict}' — defaulting to 'comment'")
        verdict = "comment"

    # Build typed ReviewComment objects
    comments = []
    for c in raw_comments:
        try:
            comments.append(ReviewComment(
                file=c["file"],
                line=int(c.get("line", 1)),
                severity=c.get("severity", "suggestion"),
                category=c.get("category", "style"),
                title=c.get("title", ""),
                body=c.get("body", ""),
            ))
        except (KeyError, TypeError, ValueError) as e:
            logger.warning(f"Skipping malformed comment {c}: {e}")

    logger.info(
        f"Review complete: verdict={verdict}, "
        f"comments={len(comments)}, model={model_name}"
    )

    return ReviewResult(
        summary=summary,
        verdict=verdict,
        comments=comments,
        raw_response=raw_text,
        model_used=model_name,
    )


# ─────────────────────────────────────────────────────────────────────────────
# Format comment body for GitHub (markdown)
# ─────────────────────────────────────────────────────────────────────────────

_SEVERITY_EMOJI = {
    "critical":   "🔴",
    "warning":    "🟡",
    "suggestion": "🔵",
    "praise":     "✅",
}

_CATEGORY_EMOJI = {
    "bug":         "🐛",
    "security":    "🔒",
    "performance": "⚡",
    "style":       "🎨",
    "logic":       "🧠",
    "docs":        "📝",
}


def format_comment_body(comment: ReviewComment) -> str:
    """
    Format a ReviewComment as a GitHub-flavored markdown comment body.
    This is the text posted as the inline review comment on the PR.
    """
    sev_emoji = _SEVERITY_EMOJI.get(comment.severity, "💬")
    cat_emoji = _CATEGORY_EMOJI.get(comment.category, "")

    return (
        f"{sev_emoji} **{comment.title}**\n\n"
        f"{cat_emoji} _{comment.category.capitalize()}_ · "
        f"_{comment.severity.capitalize()}_\n\n"
        f"{comment.body}"
    )


def format_pr_summary(result: ReviewResult) -> str:
    """
    Format the overall review summary posted as a top-level PR review body.
    """
    verdict_line = {
        "approve":         "✅ **Approved** — this PR looks good!",
        "request_changes": "❌ **Changes Requested** — please address the issues below.",
        "comment":         "💬 **Review Comments** — suggestions for improvement.",
    }.get(result.verdict, "💬 **Review Complete**")

    severity_counts: dict[str, int] = {}
    for c in result.comments:
        severity_counts[c.severity] = severity_counts.get(c.severity, 0) + 1

    counts_line = " · ".join(
        f"{_SEVERITY_EMOJI.get(k, '')} {v} {k}"
        for k, v in sorted(severity_counts.items())
    )

    lines = [
        "## 🤖 AI Code Review\n",
        verdict_line,
        "",
        result.summary,
    ]

    if counts_line:
        lines += ["", f"**Issues found:** {counts_line}"]

    lines += [
        "",
        "---",
        "*Reviewed by GitHub AI Bot — powered by Google Gemini*",
    ]

    return "\n".join(lines)

