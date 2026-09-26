from django.urls import path
from . import views

urlpatterns = [
    # Webhook receiver (called by GitHub)
    path('webhook/', views.github_webhook, name='github_webhook'),

    # Repos API
    path('repos/', views.list_repos, name='list_repos'),
    path('repos/register-webhooks/', views.register_webhooks_view, name='register_webhooks'),
    path('repos/remove-webhook/', views.remove_webhook_view, name='remove_webhook'),
]
