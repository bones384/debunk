from django.urls import path
from . import views

urlpatterns = [
    path("entries/", views.EntryListCreate.as_view(), name='entries'),
    path('entries/<int:pk>/', views.EntryDetailView.as_view(), name='entry'),
    path('entries/<int:pk>/upvote/', views.EntryRateView.as_view(), name="entry-upvote"),
    path('ranking/', views.RankingView.as_view(), name='ranking'),
    path('categories/', views.TagListCreate.as_view(), name='categories'),
    path('categories/<int:pk>/', views.TagDetailView.as_view(), name='category'),
    path('applications/', views.ApplicationListCreateView.as_view(), name='application-list-create'),
    path('applications/<int:pk>/', views.ApplicationDetailView.as_view(), name='application-detail'),
    path('users/<int:pk>/request/', views.UserAcceptedApplicationView.as_view(), name='user-accepted-request'),
    path('requests/', views.RequestListCreate.as_view(), name='requests'),
    path('requests/<int:pk>/', views.RequestDetailView.as_view(), name='request'),
    path('requests/unassigned/', views.RequestUnassignedListView.as_view(), name='unassigned-requests'),
    #path('requests/assigned/', views.RequestAssignedListView.as_view(), name='assigned-requests'),
    #path('requests/closed/', views.RequestClosedListView.as_view(), name='closed-requests'),
    #path('requests/<int:pk>/assign/', views.RequestAssignView.as_view(), name='closed-requests'),
]

