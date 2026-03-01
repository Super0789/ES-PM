from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ApprovedBOQViewSet

router = DefaultRouter()
router.register(r'boq', ApprovedBOQViewSet, basename='boq')

urlpatterns = [
    path('', include(router.urls)),
]
