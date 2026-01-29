from django.contrib.auth.models import User
from rest_framework import serializers

from .models import Profile, Entry, Tag, EntryTagAssignment, Application, ApplicationDocument


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
            rows = obj.assigned_tags.all()
            return TagSerializer([row.tag for row in rows], many=True).data
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
    tags = serializers.SerializerMethodField(read_only=True)
    tag_ids = serializers.ListField(child=serializers.IntegerField(), write_only=True)

    user_vote = serializers.SerializerMethodField()
    class Meta:
        model = Entry
        fields = ['id', 'author', 'title','is_truthful', 'content','sources', 'articles', 'tags', 'tag_ids',
                  'upvotes_count', 'user_vote', 'created_at']

    def create(self, validated_data):
        tag_ids = validated_data.pop("tag_ids", [])
        req = self.context.get("request")

        entry = Entry.objects.create(
            **validated_data
        )

        for tag_id in tag_ids:
            tag = Tag.objects.get(id=tag_id)
            EntryTagAssignment.objects.create(entry=entry, tag=tag)

        return entry

    def get_tags(self, obj):
        rows = obj.assigned_tags.all()
        return TagSerializer([row.tag for row in rows], many=True).data

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

class ApplicationDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = ApplicationDocument
        fields = ['id', 'image', 'uploaded_at']

class ApplicationListSerializer(serializers.ModelSerializer):
    author = serializers.ReadOnlyField(source='author.username')
    
    class Meta:
        model = Application
        fields = ['id', 'author', 'title', 'tags', 'is_accepted', 'created_at']

class ApplicationDetailSerializer(serializers.ModelSerializer):
    author = serializers.ReadOnlyField(source='author.username')
    uploaded_scans = ApplicationDocumentSerializer(source='scans', many=True, read_only=True)

    class Meta:
        model = Application
        fields = [
            'id', 'author', 'title', 'content', 'tags', 
            'is_accepted', 'created_at', 'uploaded_scans'
        ]

class ApplicationCreateSerializer(serializers.ModelSerializer):
    scans = serializers.ListField(
        child=serializers.ImageField(),
        write_only=True,
        required=False
    )
    uploaded_scans = ApplicationDocumentSerializer(source='scans', many=True, read_only=True)
    
    author = serializers.ReadOnlyField(source='author.username')

    class Meta:
        model = Application
        fields = [
            'id', 'author', 'title', 'content', 'tags', 
            'scans', 'uploaded_scans', 'created_at' 
        ]

    def create(self, validated_data):
        scans_data = validated_data.pop('scans', [])
        
        request = self.context.get('request')
        validated_data['author'] = request.user

        application = Application.objects.create(**validated_data)

        for scan_image in scans_data:
            ApplicationDocument.objects.create(application=application, image=scan_image)

        return application