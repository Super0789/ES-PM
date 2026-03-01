import csv
from datetime import date

from django.http import HttpResponse
from django.db.models import Q, Count, Sum, F
from rest_framework import generics, status, filters as drf_filters
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet
from django_filters.rest_framework import DjangoFilterBackend

from accounts.permissions import IsAdminRole, IsEditorOrAbove, IsViewerOrAbove
from accounts.models import AuditLog
from .models import Project
from .serializers import ProjectSerializer, ProjectListSerializer
from .filters import ProjectFilter


def _log_audit(request, action, project, changes=None):
    user = request.user if request and request.user.is_authenticated else None
    AuditLog.objects.create(
        user=user,
        action=action,
        model_name='Project',
        object_id=str(project.Project_number),
        changes=changes or {},
    )


class ProjectViewSet(ModelViewSet):
    queryset = Project.objects.all()
    filterset_class = ProjectFilter
    search_fields = ['Project_number', 'Project_Name', 'Contract_number', 'Client']
    ordering_fields = ['Project_number', 'Project_Name', 'Main_Contract_Value']

    def get_serializer_class(self):
        if self.action == 'list':
            return ProjectListSerializer
        return ProjectSerializer

    def get_permissions(self):
        if self.action in ('list', 'retrieve', 'stats', 'overdue', 'handing_over', 'export'):
            return [IsViewerOrAbove()]
        if self.action == 'destroy':
            return [IsAdminRole()]
        return [IsEditorOrAbove()]

    def get_queryset(self):
        qs = Project.objects.all()
        # Default: exclude completed unless show_completed=true
        show_completed = self.request.query_params.get('show_completed', 'false')
        if show_completed.lower() != 'true' and self.action == 'list':
            qs = qs.exclude(Project_Finished='Yes')
        # Default sort: year desc then project number asc
        qs = qs.order_by('-Project_number')
        return qs

    def perform_create(self, serializer):
        project = serializer.save()
        _log_audit(self.request, 'create', project, serializer.data)

    def perform_update(self, serializer):
        project = serializer.save()
        _log_audit(self.request, 'update', project, serializer.data)

    def perform_destroy(self, instance):
        _log_audit(self.request, 'delete', instance, {'Project_number': instance.Project_number})
        instance.delete()

    @action(detail=False, methods=['get'], url_path='export')
    def export(self, request):
        """Export projects to CSV."""
        qs = self.filter_queryset(self.get_queryset())
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="projects.csv"'
        fields = [f.name for f in Project._meta.fields]
        writer = csv.DictWriter(response, fieldnames=fields + [
            'overall_project_value', 'financial_percent_completed', 'deadline', 'is_overdue'
        ])
        writer.writeheader()
        for p in qs:
            row = {f: getattr(p, f) for f in fields}
            row['overall_project_value'] = float(p.overall_project_value)
            row['financial_percent_completed'] = round(p.financial_percent_completed, 6)
            row['deadline'] = p.deadline.isoformat() if p.deadline else ''
            row['is_overdue'] = p.is_overdue
            writer.writerow(row)
        return response

    @action(detail=False, methods=['get'], url_path='stats')
    def stats(self, request):
        """Dashboard statistics."""
        qs = Project.objects.all()
        total = qs.count()
        finished = qs.filter(Project_Finished='Yes').count()
        active = qs.exclude(Project_Finished='Yes').count()
        today = date.today()

        overdue_count = sum(1 for p in qs.exclude(Project_Finished='Yes') if p.is_overdue)
        initial_ho_pending = qs.filter(Initial_Handing_Over_Status='Pending').count()
        final_ho_pending = qs.filter(Final_Handing_Over_Status='Pending').count()

        total_contract_value = float(qs.aggregate(s=Sum('Main_Contract_Value'))['s'] or 0)
        total_received = float(qs.aggregate(s=Sum('Overall_Received_Payments'))['s'] or 0)

        return Response({
            'total_projects': total,
            'finished_projects': finished,
            'active_projects': active,
            'overdue_projects': overdue_count,
            'initial_ho_pending': initial_ho_pending,
            'final_ho_pending': final_ho_pending,
            'total_contract_value': total_contract_value,
            'total_received_payments': total_received,
        })

    @action(detail=False, methods=['get'], url_path='overdue')
    def overdue(self, request):
        """List overdue projects."""
        qs = Project.objects.exclude(Project_Finished='Yes')
        overdue = [p for p in qs if p.is_overdue]
        serializer = ProjectListSerializer(overdue, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='handing-over')
    def handing_over(self, request):
        """Projects with pending handing-over."""
        qs = Project.objects.filter(
            Q(Initial_Handing_Over_Status='Pending') | Q(Final_Handing_Over_Status='Pending')
        )
        serializer = ProjectListSerializer(qs, many=True)
        return Response(serializer.data)
