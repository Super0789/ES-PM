from django.urls import path
from .views import (
    LoginView, RefreshView, LogoutView,
    MeView, UserListCreateView, UserDetailView,
    AuditLogListView,
)

urlpatterns = [
    path('login/', LoginView.as_view(), name='auth-login'),
    path('refresh/', RefreshView.as_view(), name='auth-refresh'),
    path('logout/', LogoutView.as_view(), name='auth-logout'),
    path('me/', MeView.as_view(), name='auth-me'),
    path('users/', UserListCreateView.as_view(), name='user-list'),
    path('users/<int:pk>/', UserDetailView.as_view(), name='user-detail'),
    path('audit-log/', AuditLogListView.as_view(), name='audit-log'),
]
