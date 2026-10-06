"""
github_auth.py
--------------
Handles GitHub App authentication:
  - JWT generation (signed with private RSA key)
  - Installation access token exchange
"""

import time
import jwt
import requests
from decouple import config

GITHUB_APP_ID = config('GITHUB_APP_ID', default='')
GITHUB_PRIVATE_KEY_PATH = config('GITHUB_PRIVATE_KEY_PATH', default='')


def _load_private_key() -> str:
    """Read the PEM private key from disk."""
    if not GITHUB_PRIVATE_KEY_PATH:
        raise ValueError("GITHUB_PRIVATE_KEY_PATH is not set in .env")
    with open(GITHUB_PRIVATE_KEY_PATH, 'r') as f:
        return f.read()


def get_jwt_token() -> str:
    """
    Generate a short-lived JWT (max 10 min) for GitHub App API calls.
    Must be called before any App-level endpoint.
    """
    if not GITHUB_APP_ID:
        raise ValueError("GITHUB_APP_ID is not set in .env")
    private_key = _load_private_key()
    now = int(time.time())
    payload = {
        'iat': now - 60,          # issued 60s ago (clock-drift buffer)
        'exp': now + (10 * 60),   # expires in 10 minutes
        'iss': GITHUB_APP_ID,
    }
    return jwt.encode(payload, private_key, algorithm='RS256')


def get_installation_token(installation_id: int) -> str:
    """
    Exchange a JWT for an installation access token.
    This token allows acting on behalf of a specific installation.
    """
    jwt_token = get_jwt_token()
    url = f"https://api.github.com/app/installations/{installation_id}/access_tokens"
    headers = {
        "Authorization": f"Bearer {jwt_token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    response = requests.post(url, headers=headers, timeout=10)
    response.raise_for_status()
    return response.json()['token']


def get_github_api_headers(installation_id: int) -> dict:
    """Return ready-to-use headers for GitHub REST API calls."""
    token = get_installation_token(installation_id)
    return {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }