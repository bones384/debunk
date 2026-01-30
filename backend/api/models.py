import os
import uuid

from django.db import models
from django.contrib.auth.models import User


# Create your models here.

class AccountType(models.TextChoices):
    STANDARD = 'standard', 'Standard'
    REDACTOR = 'redactor', 'Redactor'


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    user_type = models.CharField(
        max_length=20,
        choices=AccountType.choices,
        default=AccountType.STANDARD
    )


class Tag(models.Model):
    name = models.CharField(max_length=50)

    def __str__(self):
        return self.name


class RedactorTagAssignment(models.Model):
    redactor = models.ForeignKey(User, limit_choices_to={'user_type': "Redactor"}, on_delete=models.CASCADE,
                                 related_name="assigned_tags")
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
    # tags = models.ManyToManyField(Tag, related_name="posts")
    created_at = models.DateTimeField(auto_now_add=True)
    is_truthful = models.BooleanField()

    def __str__(self):
        return self.title


class EntryTagAssignment(models.Model):
    entry = models.ForeignKey(Entry, on_delete=models.CASCADE, related_name="assigned_tags")
    tag = models.ForeignKey(Tag, on_delete=models.CASCADE, related_name="assigned_entries")

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["entry", "tag"],
                name="unique_entry_tag_assignment"
            )
        ]


class Upvote(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="upvotes")
    entry = models.ForeignKey(Entry, on_delete=models.CASCADE, related_name="upvoted")

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user", "entry"],
                name="unique_user_entry_like"
            )
        ]


def get_file_path(instance, filename):
    ext = filename.split('.')[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    return os.path.join('application_scans', filename)


class Application(models.Model):
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name="applications")
    title = models.CharField(max_length=200)
    content = models.TextField()

    tags = models.JSONField(default=list, blank=True)

    is_accepted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Application {self.id} from {self.author}"


class ApplicationDocument(models.Model):
    application = models.ForeignKey(Application, on_delete=models.CASCADE, related_name='scans')

    image = models.ImageField(upload_to=get_file_path)

    uploaded_at = models.DateTimeField(auto_now_add=True)


    def __str__(self):
        return f"Scan from application {self.application.id}"
