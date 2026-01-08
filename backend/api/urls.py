from django.urls import path
from . import views

urlpatterns = [
    path("entry/get/all/", views.PostListCreate.as_view(), name='entry-list'),
    path('entry/create/', views.PostListCreate.as_view(), name='entry-create'),
    path('entry/get/<int:pk>/', views.PostDetailView.as_view(), name='entry-detail'),
    path('entry/delete/<int:pk>/', views.PostDeleteView.as_view(), name='entry-delete'),
    path('entry/edit/<int:pk>/', views.PostUpdateView.as_view(), name='entry-edit'),
    path('entry/rate/<int:pk>/', views.PostRateView.as_view(), name='entry-rate'),
]

