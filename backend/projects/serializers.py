from rest_framework import serializers
from .models import Project


class ProjectSerializer(serializers.ModelSerializer):
    # Read-only calculated fields
    overall_project_value = serializers.SerializerMethodField()
    financial_percent_completed = serializers.SerializerMethodField()
    remaining_percent = serializers.SerializerMethodField()
    deadline = serializers.SerializerMethodField()
    is_overdue = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = '__all__'

    def get_overall_project_value(self, obj):
        return float(obj.overall_project_value)

    def get_financial_percent_completed(self, obj):
        return round(obj.financial_percent_completed, 6)

    def get_remaining_percent(self, obj):
        return round(obj.remaining_percent, 6)

    def get_deadline(self, obj):
        dl = obj.deadline
        return dl.isoformat() if dl else None

    def get_is_overdue(self, obj):
        return obj.is_overdue


class ProjectListSerializer(serializers.ModelSerializer):
    """Lighter serializer for list views."""
    overall_project_value = serializers.SerializerMethodField()
    financial_percent_completed = serializers.SerializerMethodField()
    is_overdue = serializers.SerializerMethodField()
    deadline = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            'Project_number', 'Project_Name', 'Client', 'Contract_number',
            'Main_Contract_Value', 'percent_Physical_Completed', 'Overall_Received_Payments',
            'Project_Finished', 'Project_Manager',
            'Initial_Handing_Over_Status', 'Final_Handing_Over_Status',
            'Starting_Order', 'Project_End_date', 'Project_Duration_Days',
            'overall_project_value', 'financial_percent_completed', 'is_overdue', 'deadline',
        ]

    def get_overall_project_value(self, obj):
        return float(obj.overall_project_value)

    def get_financial_percent_completed(self, obj):
        return round(obj.financial_percent_completed, 6)

    def get_is_overdue(self, obj):
        return obj.is_overdue

    def get_deadline(self, obj):
        dl = obj.deadline
        return dl.isoformat() if dl else None
