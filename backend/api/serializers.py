from django.contrib.auth.models import User
from rest_framework import serializers

from api.models import Profile, Entry


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ['user_type']

class UserRegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username', 'password']
        extra_kwargs = {
            'password': {'write_only': True}

        }

    def create(self, validated_data):
        user = User.objects.create_user(
            **validated_data
        )
        return user

class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)
    class Meta:
        model = User
        fields = ['id', 'username', 'profile']

class EntrySerializer(serializers.ModelSerializer):

    upvotes_count = serializers.IntegerField(
        source="upvoted.count",
        read_only=True
    )
    author = UserSerializer(read_only=True)
    user_vote = serializers.SerializerMethodField()
    class Meta:
        model = Entry
        fields = ['id', 'author', 'title','is_truthful', 'content','sources', 'articles', 'upvotes_count', 'user_vote', 'created_at']

    def get_user_vote(self, obj):
        user = self.context.get('request').user
        if user.is_authenticated:
            return obj.upvoted.filter(user=user).exists()
        return False
    
class CurrentUserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)
    is_superuser = serializers.BooleanField(read_only=True)

    class Meta:
        model = User
        fields = ["id", "username", "profile", "is_superuser"]