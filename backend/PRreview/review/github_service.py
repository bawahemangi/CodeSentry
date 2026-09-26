"""
github_service.py
-----------------
PyGithub-based service layer:
  - List all repos accessible to an installation
  - Register (or update) webhooks on selected repos
  - Remove webhooks from repos
"""

import logging
from typing import Optional
from github import Github, GithubException
from decouple import config

from .github_auth import get_installation_token

logger = logging.getLogger(__name__)

# The webhook URL GitHub will call (your ngrok/smee URL + Django endpoint)
WEBHOOK_URL = config('WEBHOOK_URL', default='')
WEBHOOK_SECRET = config('GITHUB_WEBHOOK_SECRET', default='')

# Events the webhook will subscribe to
WEBHOOK_EVENTS = ['pull_request', 'push', 'pull_request_review']


# ---------------------------------------------------------------------------
# Internal helper
# ---------------------------------------------------------------------------

def _get_github_client(installation_id: int) -> Github:
    """Return an authenticated PyGithub client for the given installation."""
    token = get_installation_token(installation_id)
    return Github(token)


# ---------------------------------------------------------------------------
# Fetch Repos
# ---------------------------------------------------------------------------

def list_installation_repos(installation_id: int) -> list[dict]:
    """
    Fetch all repositories accessible to a GitHub App installation.

    Returns a list of dicts with repo metadata:
        {
            "id": 12345,
            "name": "my-repo",
            "full_name": "owner/my-repo",
            "private": False,
            "html_url": "https://github.com/owner/my-repo",
            "default_branch": "main",
            "owner": "owner",
            "webhook_registered": False  # filled in by check_webhook_registered()
        }
    """
    g = _get_github_client(installation_id)
    repos = []

    try:
        # get_repos() returns all repos for the authenticated token
        for repo in g.get_user().get_repos():
            repos.append({
                "id": repo.id,
                "name": repo.name,
                "full_name": repo.full_name,
                "private": repo.private,
                "html_url": repo.html_url,
                "default_branch": repo.default_branch,
                "owner": repo.owner.login,
                "webhook_registered": False,  # updated below
            })

        # Check which repos already have our webhook
        for repo_data in repos:
            repo_data['webhook_registered'] = check_webhook_registered(
                installation_id, repo_data['full_name']
            )

    except GithubException as e:
        logger.error(f"Failed to list repos for installation {installation_id}: {e}")
        raise

    logger.info(f"Fetched {len(repos)} repos for installation {installation_id}")
    return repos


# ---------------------------------------------------------------------------
# Check Webhook
# ---------------------------------------------------------------------------

def check_webhook_registered(installation_id: int, repo_full_name: str) -> bool:
    """
    Check if our webhook URL is already registered on the given repo.
    Returns True if found, False otherwise.
    """
    if not WEBHOOK_URL:
        return False

    g = _get_github_client(installation_id)
    try:
        repo = g.get_repo(repo_full_name)
        hooks = repo.get_hooks()
        for hook in hooks:
            if hook.config.get('url') == WEBHOOK_URL:
                return True
    except GithubException as e:
        logger.warning(f"Could not check hooks on {repo_full_name}: {e}")
    return False


# ---------------------------------------------------------------------------
# Register Webhook
# ---------------------------------------------------------------------------

def register_webhook(installation_id: int, repo_full_name: str) -> dict:
    """
    Register our webhook on a single repo.

    - If the webhook already exists (same URL), returns existing hook info.
    - If not, creates a new webhook with pull_request + push events.

    Returns a dict:
        {
            "success": True,
            "hook_id": 123,
            "action": "created" | "already_exists",
            "repo": "owner/repo"
        }
    """
    if not WEBHOOK_URL:
        raise ValueError("WEBHOOK_URL is not set in .env — cannot register webhook.")

    g = _get_github_client(installation_id)
    repo = g.get_repo(repo_full_name)

    # Check if already exists
    try:
        for hook in repo.get_hooks():
            if hook.config.get('url') == WEBHOOK_URL:
                logger.info(f"Webhook already exists on {repo_full_name} (hook_id={hook.id})")
                return {
                    "success": True,
                    "hook_id": hook.id,
                    "action": "already_exists",
                    "repo": repo_full_name,
                }
    except GithubException as e:
        logger.warning(f"Could not list existing hooks on {repo_full_name}: {e}")

    # Create new webhook
    config_payload = {
        "url": WEBHOOK_URL,
        "content_type": "json",
        "secret": WEBHOOK_SECRET,
        "insecure_ssl": "0",
    }

    try:
        hook = repo.create_hook(
            name="web",
            config=config_payload,
            events=WEBHOOK_EVENTS,
            active=True,
        )
        logger.info(f"Registered webhook on {repo_full_name} (hook_id={hook.id})")
        return {
            "success": True,
            "hook_id": hook.id,
            "action": "created",
            "repo": repo_full_name,
        }
    except GithubException as e:
        logger.error(f"Failed to register webhook on {repo_full_name}: {e}")
        raise


# ---------------------------------------------------------------------------
# Register Webhooks on Multiple Repos (Bulk)
# ---------------------------------------------------------------------------

def register_webhooks_bulk(installation_id: int, repo_full_names: list[str]) -> list[dict]:
    """
    Register webhooks on multiple repos at once.

    Args:
        installation_id: GitHub App installation ID
        repo_full_names: List of "owner/repo" strings

    Returns:
        List of result dicts (one per repo), each with "success" and details.
    """
    results = []
    for full_name in repo_full_names:
        try:
            result = register_webhook(installation_id, full_name)
            results.append(result)
        except Exception as e:
            results.append({
                "success": False,
                "repo": full_name,
                "error": str(e),
            })
    return results


# ---------------------------------------------------------------------------
# Remove Webhook
# ---------------------------------------------------------------------------

def remove_webhook(installation_id: int, repo_full_name: str) -> dict:
    """
    Remove our webhook from a repo (by matching URL).

    Returns:
        {"success": True/False, "repo": "owner/repo", "action": "deleted" | "not_found"}
    """
    if not WEBHOOK_URL:
        raise ValueError("WEBHOOK_URL is not set in .env.")

    g = _get_github_client(installation_id)
    repo = g.get_repo(repo_full_name)

    try:
        for hook in repo.get_hooks():
            if hook.config.get('url') == WEBHOOK_URL:
                hook.delete()
                logger.info(f"Deleted webhook on {repo_full_name} (hook_id={hook.id})")
                return {"success": True, "repo": repo_full_name, "action": "deleted"}
    except GithubException as e:
        logger.error(f"Failed to remove webhook on {repo_full_name}: {e}")
        raise

    return {"success": True, "repo": repo_full_name, "action": "not_found"}
