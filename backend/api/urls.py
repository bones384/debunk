from django.urls import path
from . import views

urlpatterns = [
    path("entries/", views.EntryListCreate.as_view(), name='entries'),
    path('entries/<int:pk>/', views.EntryDetailView.as_view(), name='entry'),
    path('entries/<int:pk>/upvote/', views.EntryRateView.as_view(), name="entry-upvote"),

]

