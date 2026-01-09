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

    upvotes_count = serializers.SerializerMethodField()
    user_vote = serializers.SerializerMethodField()
    class Meta:
        model = Post
        fields = ['id', 'author', 'title', 'content','link_source', 'link_article', 'upvotes', 'created_at']

    def get_upvotes_count(self, obj):
        return obj.upvotes.count()

    def get_user_vote(self, obj):
        user = self.context.get('request').user
        if user.is_authenticated:
            if obj.upvotes.filter(pk=user.pk).exists():
                return 'up'
        return None