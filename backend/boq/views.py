from rest_framework.viewsets import ModelViewSet

from accounts.permissions import IsAdminRole, IsEditorOrAbove, IsViewerOrAbove
from accounts.models import AuditLog
from .models import ApprovedBOQ
from .serializers import ApprovedBOQSerializer


def _log_audit(request, action_name, boq, changes=None):
    user = request.user if request and request.user.is_authenticated else None
    AuditLog.objects.create(
        user=user,
        action=action_name,
        model_name='ApprovedBOQ',
        object_id=str(boq.BOQ_ID),
        changes=changes or {},
    )


class ApprovedBOQViewSet(ModelViewSet):
    serializer_class = ApprovedBOQSerializer
    filterset_fields = ['Project_number']
    search_fields = ['BOQ_Name', 'Comments']

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [IsViewerOrAbove()]
        if self.action == 'destroy':
            return [IsAdminRole()]
        return [IsEditorOrAbove()]

    def get_queryset(self):
        return ApprovedBOQ.objects.select_related('Project_number').all()

    def perform_create(self, serializer):
        boq = serializer.save()
        _log_audit(self.request, 'create', boq, serializer.data)

    def perform_update(self, serializer):
        boq = serializer.save()
        _log_audit(self.request, 'update', boq, serializer.data)

    def perform_destroy(self, instance):
        _log_audit(self.request, 'delete', instance, {'BOQ_ID': instance.BOQ_ID})
        instance.delete()
