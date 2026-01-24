from django.contrib.auth.models import User
from rest_framework import serializers

from api.models import Profile, Entry, Tag


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

class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name']

class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)
    assigned_tags_ids = serializers.SerializerMethodField()
    class Meta:
        model = User
        fields = ['id', 'username', 'profile', 'assigned_tags_ids']

    def get_assigned_tags_ids(self, obj):
        if obj.profile.user_type == 'redactor':
            return obj.assigned_tags.all()
        return None

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        if ret.get('assigned_tags_ids') is None:
            ret.pop('assigned_tags_ids')
        return ret

class EntrySerializer(serializers.ModelSerializer):

    upvotes_count = serializers.IntegerField(
        source="upvoted.count",
        read_only=True
    )
    author = UserSerializer(read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    tag_ids = serializers.PrimaryKeyRelatedField(
        source='tags',
        many=True,
        queryset=Tag.objects.all(),
        write_only=True
    )
    user_vote = serializers.SerializerMethodField()
    class Meta:
        model = Entry
        fields = ['id', 'author', 'title','is_truthful', 'content','sources', 'articles', 'tags', 'tag_ids',
                  'upvotes_count', 'user_vote', 'created_at']

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