from django.db import models


class Repository(models.Model):
    name = models.CharField(max_length=200)
    full_name = models.CharField(max_length=300)
    github_url = models.URLField()
    owner = models.CharField(max_length=200)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.full_name


class PullRequest(models.Model):
    repository = models.ForeignKey(
        Repository,
        on_delete=models.CASCADE,
        related_name='pull_requests'
    )

    github_pr_id = models.IntegerField()
    number = models.IntegerField()
    title = models.CharField(max_length=300)
    author = models.CharField(max_length=200)
    source_branch = models.CharField(max_length=200)
    target_branch = models.CharField(max_length=200)

    status = models.CharField(max_length=50, default='open')

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.repository.name} - PR #{self.number}"


class Review(models.Model):
    pull_request = models.ForeignKey(
        PullRequest,
        on_delete=models.CASCADE,
        related_name='reviews'
    )

    status = models.CharField(max_length=50, default='pending')

    summary = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Review for PR #{self.pull_request.number}"


class Finding(models.Model):
    review = models.ForeignKey(
        Review,
        on_delete=models.CASCADE,
        related_name='findings'
    )

    finding_type = models.CharField(max_length=100)
    severity = models.CharField(max_length=50)

    file_path = models.CharField(max_length=500)
    line_number = models.IntegerField(null=True, blank=True)

    title = models.CharField(max_length=300)
    description = models.TextField()
    suggestion = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title