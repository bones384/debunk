"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from api.views import CreateUserView, ChangeProfileTypeView, CurrentUserView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from api.views import UsersAll

from api.views import UserDetailView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/register/", CreateUserView.as_view(), name="register-user"),
    path("api/auth/token/", TokenObtainPairView.as_view(), name="get-token"),
    path("api/auth/token/refresh/", TokenRefreshView.as_view(), name="refresh-token"),
    #path("api/auth/", include("rest_framework.urls")),
    path("api/users/<int:pk>/role/", ChangeProfileTypeView.as_view(), name="change-user-type"),
    path("api/users/me/", CurrentUserView.as_view(), name="current-user"),
    path("api/", include("api.urls")),
    path("api/users/", UsersAll.as_view(), name="get-all-users"),
    path("api/users/<int:pk>/", UserDetailView.as_view(),name="user")
]
