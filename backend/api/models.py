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
class Entry(models.Model):
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name="posts")
    title = models.CharField(max_length=200)
    content = models.TextField()
    sources = models.JSONField(default=list, blank=True)
    articles = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_truthful = models.BooleanField()
    def __str__(self):
        return self.title

class Upvote(models.Model):
    user = models.ForeignKey(User,on_delete=models.CASCADE,related_name="upvotes")
    entry = models.ForeignKey(Entry,on_delete=models.CASCADE,related_name="upvoted")

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user", "entry"],
                name="unique_user_entry_like"
            )
        ]
