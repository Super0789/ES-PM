from django.conf import settings
from django.db import models


class Attachment(models.Model):
    Attachment_ID = models.AutoField(primary_key=True)
    Project_number = models.ForeignKey(
        'projects.Project',
        on_delete=models.CASCADE,
        related_name='attachments',
        db_column='Project_number',
    )
    Payment_ID = models.ForeignKey(
        'payments.Payment',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='attachments',
    )
    Field_name = models.CharField(max_length=100)
    File_path = models.FileField(upload_to='attachments/')
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'attachments_attachment'
        ordering = ['-uploaded_at']

    def __str__(self):
        return f"Attachment {self.Attachment_ID} – {self.Field_name}"
