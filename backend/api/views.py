from django.shortcuts import render
from django.contrib.auth.models import User
from rest_framework import generics
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Profile
from .serializers import UserRegisterSerializer, UserTypeUpdateSerializer, UserGetSerializer
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser


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