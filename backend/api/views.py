from django.shortcuts import render
from django.contrib.auth.models import User
from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404

from .models import Profile, Post
from .serializers import UserRegisterSerializer, UserTypeUpdateSerializer, UserGetSerializer, PostSerializer
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser, IsAuthenticatedOrReadOnly
from .permissions import IsAuthorOrAdmin, IsAuthorOrAdminOrReadOnly


# Create your views here.
class CreateUserView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegisterSerializer
    permission_classes = [AllowAny]

class ChangeProfileTypeView(generics.UpdateAPIView):
    queryset = Profile.objects.all()
    serializer_class = UserTypeUpdateSerializer
    permission_classes = [IsAdminUser]

    def get_object(self):
        # admin chooses which user to modify
        user_id = self.kwargs.get("pk")
        return Profile.objects.get(user_id=user_id)



class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # request.user is the currently logged-in user
        serializer = UserGetSerializer(request.user)
        return Response(serializer.data)


class PostListCreate(generics.ListCreateAPIView):
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        user = self.request.user
        return Post.objects.all()

    def perform_create(self, serializer):
        if serializer.is_valid():
            serializer.save(author=self.request.user)
        else:
            print(serializer.errors)
            
class PostDetailView(generics.RetrieveAPIView):
    queryset = Post.objects.all()
    serializer_class = PostSerializer
    permission_classes = [AllowAny]

class PostDeleteView(generics.DestroyAPIView):
    queryset = Post.objects.all()
    serializer_class = PostSerializer
    permission_classes = [IsAuthorOrAdmin]

    def get_queryset(self):
        user = self.request.user
        return Post.objects.filter(author=user)


class PostUpdateView(generics.UpdateAPIView):
    queryset = Post.objects.all()
    serializer_class = PostSerializer
    permission_classes = [IsAdminUser]

class PostRateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
            post = get_object_or_404(Post, pk=pk)
            user = request.user
            action = request.data.get('action')

            if action == 'upvote':            
                if post.upvotes.filter(pk=user.pk).exists():
                    post.upvotes.remove(user)
                else:
                    post.upvotes.add(user)

            user_vote_status = None
            if post.upvotes.filter(pk=user.pk).exists(): user_vote_status = 'up'

            return Response({
                'status': 'rated',
                'upvotes': post.upvotes.count(),
                'user_vote': user_vote_status
            }, status=status.HTTP_200_OK)