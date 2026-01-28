from django.shortcuts import render
from django.contrib.auth.models import User
from rest_framework import generics, permissions, status
from rest_framework.generics import ListAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from collections import Counter
from urllib.parse import urlparse

from .models import Profile, Upvote, Entry, Tag
from .serializers import UserRegisterSerializer, UserSerializer, UserProfileSerializer, EntrySerializer, TagSerializer
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAuthenticatedOrReadOnly, IsAdminUser
from .permissions import IsAuthorOrAdmin, IsAuthorOrAdminOrReadOnly, IsAdminOrSelf, IsRedactorOrReadOnlyObject, \
    IsAuthor, IsRedactor
from .serializers import (
    UserRegisterSerializer, UserSerializer, UserProfileSerializer, EntrySerializer, CurrentUserSerializer
)


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
        serializer = CurrentUserSerializer(request.user)
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
        if self.request.method == "GET":
            return [AllowAny()]
        if self.request.method == "PUT" or self.request.method == "POST":
            return [IsRedactor()]
        if self.request.method == "DELETE":
            return [IsAdminUser()]

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

class RankingView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        fake_entries = Entry.objects.filter(is_truthful=False)
        domain_counter = Counter()

        for entry in fake_entries:

            links_to_analyze = entry.articles or []
            for link in links_to_analyze:
                if not link: continue
                
                try:
                    parsed_uri = urlparse(link)
                    domain = parsed_uri.netloc.lower()
                    
                    if domain.startswith('www.'):
                        domain = domain[4:]
                    
                    if domain:
                        domain_counter[domain] += 1
                except Exception:
                    continue

        sorted_domains = domain_counter.most_common()        
        ranking_list = []
        current_rank = 0
        last_count = -1
        
        for i, (domain, count) in enumerate(sorted_domains):
            if count != last_count:
                current_rank += 1
            
            last_count = count

            if current_rank > 25:
                break

            ranking_list.append({
                "rank": current_rank,
                "domain": domain,
                "count": count
            })

        return Response(ranking_list)

class TagListCreate(generics.ListCreateAPIView):
    serializer_class = TagSerializer

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        if self.request.method == "PUT" or self.request.method == "POST":
            return [IsAdminUser()]

        return super().get_permissions()

    def get_queryset(self):
        return Tag.objects.all()

class TagDetailView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, pk):
        tag = get_object_or_404(Tag, pk=pk)
        return Response(TagSerializer(tag).data, status=status.HTTP_204_NO_CONTENT)

    def delete(self, request, pk):
        if request.user.is_staff:
            tag = get_object_or_404(Tag, pk=pk)
            # tag.posts.clear()
            tag.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)