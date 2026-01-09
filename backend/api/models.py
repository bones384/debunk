from django.db import models
from django.contrib.auth.models import User
# Create your models here.

class AccountType(models.TextChoices):
    STANDARD = 'standard', 'Standard'
    REDACTOR = 'redactor', 'Redactor'


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE,related_name="profile")
    user_type = models.CharField(
        max_length=20,
        choices=AccountType.choices,
        default=AccountType.STANDARD
    )
class Post(models.Model):
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name="posts")
    title = models.CharField(max_length=200)
    content = models.TextField()
    links_source = models.JSONField(default=list, blank=True)
    links_article = models.JSONField(default=list, blank=True)
    upvotes = models.ManyToManyField(User, related_name='upvoted_posts', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

    def total_score(self):
        return self.upvotes.count()
