import json
import hmac
import hashlib
import logging
from django.http import HttpResponse, HttpResponseForbidden, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from decouple import config

from .github_service import (
    list_installation_repos,
    register_webhook,
    register_webhooks_bulk,
    remove_webhook,
)

logger = logging.getLogger(__name__)

# Retrieve the webhook secret from your .env file
GITHUB_WEBHOOK_SECRET = config('GITHUB_WEBHOOK_SECRET', default='')

def verify_signature(payload_body, secret_token, signature_header):
    """Verify that the payload was sent from GitHub by validating SHA256."""
    if not signature_header:
        return False
    
    hash_object = hmac.new(secret_token.encode('utf-8'), msg=payload_body, digestmod=hashlib.sha256)
    expected_signature = "sha256=" + hash_object.hexdigest()
    
    return hmac.compare_digest(expected_signature, signature_header)

@csrf_exempt
def github_webhook(request):
    if request.method == "POST":
        # Get the signature from the headers
        signature_header = request.headers.get("X-Hub-Signature-256")
        
        # Verify the payload signature
        if not verify_signature(request.body, GITHUB_WEBHOOK_SECRET, signature_header):
            return HttpResponseForbidden("Invalid signature!")
            
        try:
            payload = json.loads(request.body)
            event_type = request.headers.get("X-GitHub-Event")
            
            # Here you can process different events
            if event_type == "pull_request":
                action = payload.get("action")
                logger.info(f"Received pull_request event. Action: {action}")
                # TODO: Trigger the AI review process here!
                
            elif event_type == "ping":
                logger.info("Received ping event from GitHub App installation.")
                
            return JsonResponse({"status": "success", "message": f"Processed {event_type} event"})
            
        except json.JSONDecodeError:
            return HttpResponse(status=400, content="Invalid JSON payload")
            
    return HttpResponse(status=405, content="Method Not Allowed")


# ---------------------------------------------------------------------------
# Repos API
# ---------------------------------------------------------------------------

@csrf_exempt
def list_repos(request):
    """
    GET /api/repos/?installation_id=<id>

    Returns all repositories accessible to a GitHub App installation,
    including whether our webhook is already registered on each.
    """
    if request.method != 'GET':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    installation_id = request.GET.get('installation_id')
    if not installation_id:
        return JsonResponse({'error': 'installation_id query param is required'}, status=400)

    try:
        repos = list_installation_repos(int(installation_id))
        return JsonResponse({'repos': repos, 'count': len(repos)})
    except Exception as e:
        logger.error(f"list_repos error: {e}")
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
def register_webhooks_view(request):
    """
    POST /api/repos/register-webhooks/

    Body (JSON):
        {
            "installation_id": 12345678,
            "repos": ["owner/repo1", "owner/repo2"]
        }

    Registers our webhook on each specified repo.
    Returns per-repo results with success/failure info.
    """
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    try:
        body = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON body'}, status=400)

    installation_id = body.get('installation_id')
    repos = body.get('repos', [])

    if not installation_id:
        return JsonResponse({'error': '"installation_id" is required'}, status=400)
    if not repos or not isinstance(repos, list):
        return JsonResponse({'error': '"repos" must be a non-empty list of "owner/repo" strings'}, status=400)

    try:
        results = register_webhooks_bulk(int(installation_id), repos)
        success_count = sum(1 for r in results if r.get('success'))
        return JsonResponse({
            'results': results,
            'summary': {
                'total': len(results),
                'success': success_count,
                'failed': len(results) - success_count,
            }
        })
    except Exception as e:
        logger.error(f"register_webhooks_view error: {e}")
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
def remove_webhook_view(request):
    """
    DELETE /api/repos/remove-webhook/

    Body (JSON):
        {
            "installation_id": 12345678,
            "repo": "owner/repo"
        }

    Removes our webhook from the specified repo.
    """
    if request.method != 'DELETE':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    try:
        body = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON body'}, status=400)

    installation_id = body.get('installation_id')
    repo = body.get('repo')

    if not installation_id or not repo:
        return JsonResponse({'error': '"installation_id" and "repo" are required'}, status=400)

    try:
        result = remove_webhook(int(installation_id), repo)
        return JsonResponse(result)
    except Exception as e:
        logger.error(f"remove_webhook_view error: {e}")
        return JsonResponse({'error': str(e)}, status=500)
