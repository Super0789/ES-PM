from rest_framework import serializers
from .models import ApprovedBOQ


class ApprovedBOQSerializer(serializers.ModelSerializer):
    attachment_url = serializers.SerializerMethodField()

    class Meta:
        model = ApprovedBOQ
        fields = ['BOQ_ID', 'Project_number', 'BOQ_Name', 'Value', 'Comments', 'Attachment', 'attachment_url']
        read_only_fields = ['BOQ_ID']

    def get_attachment_url(self, obj):
        request = self.context.get('request')
        if obj.Attachment and request:
            return request.build_absolute_uri(obj.Attachment.url)
        return None
