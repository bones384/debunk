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

class Tag(models.Model):
    name = models.CharField(max_length=50)
    def __str__(self):
        return self.name

class TagsAssignment(models.Model):
    redactor = models.ForeignKey(User, limit_choices_to={'user_type': "Redactor"}, on_delete=models.CASCADE, related_name="assigned_tags")
    tag = models.ForeignKey(Tag, on_delete=models.CASCADE, related_name="assigned_redactors")

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["redactor", "tag"],
                name="unique_redactor_tag_assignment"
            )
        ]

class Entry(models.Model):
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name="posts")
    title = models.CharField(max_length=200)
    content = models.TextField()
    sources = models.JSONField(default=list, blank=True)
    articles = models.JSONField(default=list, blank=True)
    tags = models.ManyToManyField(Tag, related_name="posts")
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