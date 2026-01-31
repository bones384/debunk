import os

from django.conf import settings
from django.db import transaction
from django.shortcuts import render
from django.contrib.auth.models import User
from rest_framework import generics, permissions, status, parsers
from rest_framework.generics import ListAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.response import Response
from rest_framework.views import APIView
from django.http import FileResponse, HttpResponseForbidden, Http404
from django.shortcuts import get_object_or_404
from collections import Counter
from urllib.parse import urlparse

from .models import Profile, Upvote, Entry, Tag, Application, ApplicationDocument, AccountType, RedactorTagAssignment, Request
from .serializers import UserRegisterSerializer, UserSerializer, UserProfileSerializer, EntrySerializer, TagSerializer, RequestSerializer
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAuthenticatedOrReadOnly, IsAdminUser
from .permissions import (IsAuthorOrAdmin, IsAuthorOrAdminOrReadOnly, IsAdminOrSelf, IsRedactorOrReadOnlyObject,
    IsAuthor, IsRedactor, CanCreateApplication, IsRedactorOrAdmin)
from .serializers import (
    UserRegisterSerializer, UserSerializer, UserProfileSerializer, EntrySerializer, CurrentUserSerializer, ApplicationCreateSerializer, 
    ApplicationListSerializer, ApplicationDetailSerializer
)


# Create your views here.
class CreateUserView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegisterSerializer
    permission_classes = [AllowAny]

class ChangeProfileTypeView(generics.UpdateAPIView):
    queryset = Profile.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_object(self):
        user_id = self.kwargs.get("pk")
        return get_object_or_404(Profile, user_id=user_id)

    def perform_update(self, serializer):
        with transaction.atomic():
            
            profile = serializer.save()
            user = profile.user
            new_role = profile.user_type

            if new_role == AccountType.REDACTOR:
                pending_app = Application.objects.filter(author=user, is_accepted=False).first()
                
                if pending_app:
                    pending_app.is_accepted = True
                    pending_app.save()
                    tags_ids = pending_app.tags
                    
                    if tags_ids:
                        tags_to_add = Tag.objects.filter(id__in=tags_ids)
                        
                        for tag in tags_to_add:
                            RedactorTagAssignment.objects.get_or_create(
                                redactor=user, 
                                tag=tag
                            )
            elif new_role == AccountType.STANDARD:
                RedactorTagAssignment.objects.filter(redactor=user).delete()
                Application.objects.filter(author=user, is_accepted=True).delete()



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
        return Response(TagSerializer(tag).data, status=status.HTTP_200_OK)

    def delete(self, request, pk):
        if request.user.is_staff:
            tag = get_object_or_404(Tag, pk=pk)
            # tag.posts.clear()
            tag.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class ApplicationListCreateView(generics.ListCreateAPIView):
    queryset = Application.objects.all()
    
    def get_serializer_class(self):
        
        if self.request.method == 'POST':
            return ApplicationCreateSerializer
        return ApplicationListSerializer

    def get_permissions(self):

        if self.request.method == 'POST':
            return [permissions.IsAuthenticated(), CanCreateApplication()]
        return [permissions.IsAdminUser()]


class ApplicationDetailView(generics.RetrieveDestroyAPIView):
    queryset = Application.objects.all()
    serializer_class = ApplicationDetailSerializer
    permission_classes = [permissions.IsAdminUser]


class UserAcceptedApplicationView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request, pk):
        user = get_object_or_404(User, pk=pk)
        accepted_app = Application.objects.filter(author=user, is_accepted=True).last()
        
        if accepted_app:
            serializer = ApplicationDetailSerializer(accepted_app)
            return Response(serializer.data)
        else:
            return Response(status=status.HTTP_204_NO_CONTENT)



class ProtectedMediaView(APIView):
    permission_classes = [IsAdminUser]
    def get(self, request, path):
        file_path = os.path.join(settings.MEDIA_ROOT, path)

        if not os.path.exists(file_path):
            raise Http404

        return FileResponse(open(file_path, "rb"))

class RequestListCreate(generics.ListCreateAPIView):
    serializer_class = RequestSerializer

    def get_permissions(self):
        if self.request.method == "GET":
            return [IsAdminUser()]
        if self.request.method == "PUT" or self.request.method == "POST":
            return [IsAuthenticated()]

        return super().get_permissions()

    def get_queryset(self):
        return Request.objects.filter(entry_id__isnull=True)

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

class RequestDetailView(APIView):
    def get(self, request, pk):
        req = get_object_or_404(Request, pk=pk)

        if request.user.is_staff or request.user==req.redactor:
            return Response(RequestSerializer(req).data, status=status.HTTP_200_OK)
        return Response(status=status.HTTP_204_NO_CONTENT)

    def delete(self, request, pk):
        if request.user.is_staff:
            req = get_object_or_404(Request, pk=pk)
            req.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class RequestUnassignedListView(generics.ListCreateAPIView):
    serializer_class = RequestSerializer

    def get_permissions(self):
        if self.request.method == "GET":
            return [IsRedactorOrAdmin()]

        return super().get_permissions()

    def get_queryset(self):
        unassigned_requests = Request.objects.filter(redactor__isnull=True)
        if self.request.user.is_staff:
            return unassigned_requests

        rows_user = self.request.user.assigned_tags.all()
        tag_ids_user = [row.tag.id for row in rows_user]

        result_req = []
        for request in unassigned_requests:
            rows_req = request.assigned_tags.all()
            tag_ids_req = [row.tag.id for row in rows_req]
            for tag_id_user in tag_ids_user:
                if tag_id_user in tag_ids_req:
                    result_req.append(request)
                    break

        return result_req

class RequestAssignedListView(ListAPIView):
    serializer_class = RequestSerializer

    def get_permissions(self):
        if self.request.method == "GET":
            return [IsRedactor()]

        return super().get_permissions()

    def get_queryset(self):
        return Request.objects.filter(redactor=self.request.user.id)

class RequestClosedListView(ListAPIView):
    serializer_class = RequestSerializer

    def get_permissions(self):
        if self.request.method == "GET":
            return [IsAdminUser()]

        return super().get_permissions()

    def get_queryset(self):
        return Request.objects.filter(entry_id__isnull=False)

class RequestAssignView(APIView):
    def post(self, request, pk):
        req = get_object_or_404(Request, pk=pk)

        if request.user.profile.user_type == 'redactor':
            req.redactor = request.user
            req.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def delete(self, request, pk):
        req = get_object_or_404(Request, pk=pk)

        if request.user.is_staff or request.user==req.redactor:
            req.redactor = None
            req.save()
        return Response(status=status.HTTP_204_NO_CONTENT)