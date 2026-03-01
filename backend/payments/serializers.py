from rest_framework import serializers
from .models import Payment


class PaymentSerializer(serializers.ModelSerializer):
    project_name = serializers.CharField(source='Project_number.Project_Name', read_only=True)

    class Meta:
        model = Payment
        fields = [
            'Payment_ID', 'Project_number', 'project_name',
            'Payment_value', 'Date_of_submission',
            'Certified', 'Date_of_certification', 'Payment_Slot',
        ]
        read_only_fields = ['Payment_ID', 'Certified', 'Date_of_certification', 'Payment_Slot']
