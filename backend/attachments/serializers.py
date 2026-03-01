from rest_framework import serializers
from .models import Attachment


class AttachmentSerializer(serializers.ModelSerializer):
    uploaded_by_username = serializers.CharField(source='uploaded_by.username', read_only=True)
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = Attachment
        fields = [
            'Attachment_ID', 'Project_number', 'Payment_ID',
            'Field_name', 'File_path', 'file_url',
            'uploaded_by', 'uploaded_by_username', 'uploaded_at',
        ]
        read_only_fields = ['Attachment_ID', 'uploaded_by', 'uploaded_at']

    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.File_path and request:
            return request.build_absolute_uri(obj.File_path.url)
        return None
