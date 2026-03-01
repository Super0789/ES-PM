import os

from django.http import FileResponse, Http404
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from accounts.permissions import IsAdminRole, IsEditorOrAbove, IsViewerOrAbove
from accounts.models import AuditLog
from .models import Attachment
from .serializers import AttachmentSerializer


def _log_audit(request, action_name, attachment, changes=None):
    user = request.user if request and request.user.is_authenticated else None
    AuditLog.objects.create(
        user=user,
        action=action_name,
        model_name='Attachment',
        object_id=str(attachment.Attachment_ID),
        changes=changes or {},
    )


class AttachmentViewSet(ModelViewSet):
    serializer_class = AttachmentSerializer
    filterset_fields = ['Project_number', 'Field_name', 'Payment_ID']

    def get_permissions(self):
        if self.action in ('list', 'retrieve', 'download'):
            return [IsViewerOrAbove()]
        if self.action == 'destroy':
            return [IsAdminRole()]
        return [IsEditorOrAbove()]

    def get_queryset(self):
        return Attachment.objects.select_related('Project_number', 'Payment_ID', 'uploaded_by').all()

    def perform_create(self, serializer):
        attachment = serializer.save(uploaded_by=self.request.user)
        _log_audit(self.request, 'create', attachment, {
            'field': attachment.Field_name,
            'project': str(attachment.Project_number_id),
        })

    def perform_destroy(self, instance):
        _log_audit(self.request, 'delete', instance, {'Attachment_ID': instance.Attachment_ID})
        # Remove the file from disk
        if instance.File_path:
            try:
                os.remove(instance.File_path.path)
            except OSError:
                pass
        instance.delete()

    @action(detail=True, methods=['get'], url_path='download')
    def download(self, request, pk=None):
        attachment = self.get_object()
        if not attachment.File_path:
            raise Http404
        try:
            file_handle = attachment.File_path.open('rb')
        except (FileNotFoundError, ValueError):
            raise Http404
        filename = os.path.basename(attachment.File_path.name)
        response = FileResponse(file_handle, as_attachment=True, filename=filename)
        return response
