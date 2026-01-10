from django.shortcuts import render
from django.contrib.auth.models import User
from rest_framework import generics, permissions, status
from rest_framework.generics import ListAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404

from .models import Profile, Upvote, Entry
from .serializers import UserRegisterSerializer, UserSerializer, UserProfileSerializer, EntrySerializer
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser, IsAuthenticatedOrReadOnly
from .permissions import IsAuthorOrAdmin, IsAuthorOrAdminOrReadOnly, IsAdminOrSelf, IsRedactorOrReadOnlyObject, IsAuthor


# Create your views here.
class CreateUserView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegisterSerializer
    permission_classes = [AllowAny]

class ChangeProfileTypeView(generics.UpdateAPIView):
    queryset = Profile.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [IsAdminUser]

    def get_object(self):
        # admin chooses which user to modify
        user_id = self.kwargs.get("pk")
        return Profile.objects.get(user_id=user_id)



class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # request.user is the currently logged-in user
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

class UserDetailView(RetrieveUpdateDestroyAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer

    def get_permissions(self):
        if self.request.method == "GET": # get user data
            return [AllowAny()]

        if self.request.method == "PATCH":
            return [IsAuthenticated(), IsAdminOrSelf()] #change user data

        if self.request.method == "DELETE":
            return [IsAdminUser()] #delete user from db

        return super().get_permissions()

class UsersAll(ListAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser]

class EntryListCreate(generics.ListCreateAPIView):
    serializer_class = EntrySerializer
    def get_permissions(self):
        if self.request.method == "GET": # get user data
            return [AllowAny()]

        if self.request.method == "PATCH":
            return [IsAuthenticated(), IsAuthor()] #change user data

        if self.request.method == "DELETE":
            return [IsAdminUser()] #delete user from db

        return super().get_permissions()

    def get_queryset(self):
        user = self.request.user
        return Entry.objects.all()

    def perform_create(self, serializer):

            serializer.save(author=self.request.user)

            
class EntryDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Entry.objects.all()
    serializer_class = EntrySerializer
    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]

        if self.request.method == "PATCH":
            return [IsAuthenticated(), IsAuthor()]

        if self.request.method == "DELETE":
            return [IsAdminUser()]

        return super().get_permissions()



class EntryRateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
            entry = get_object_or_404(Entry, pk=pk)
            Upvote.objects.get_or_create(user=request.user,entry=entry)

            return Response(status=status.HTTP_204_NO_CONTENT)

    def delete(self, request, pk):
        entry = get_object_or_404(Entry, pk=pk)
        Upvote.objects.filter(
            user=request.user,
            entry=entry
        ).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)