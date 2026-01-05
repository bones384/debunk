from django.contrib.auth.models import User
from rest_framework import serializers

from api.models import Profile, Post


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ['user_type']

class UserRegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username', 'password']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = User.objects.create_user(
            **validated_data
        )
        return user

class UserGetSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)
    class Meta:
        model = User
        fields = ['id', 'username', 'profile']


class UserTypeUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ["user","user_type"]

class PostSerializer(serializers.ModelSerializer):
    class Meta:
        model = Post
        fields = ['id', 'author', 'title', 'content', 'links', 'upvotes', 'created_at']