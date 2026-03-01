from django.db import models


class ApprovedBOQ(models.Model):
    BOQ_ID = models.AutoField(primary_key=True)
    Project_number = models.ForeignKey(
        'projects.Project',
        on_delete=models.CASCADE,
        related_name='boq_items',
        db_column='Project_number',
    )
    BOQ_Name = models.CharField(max_length=255)
    Value = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    Comments = models.TextField(blank=True, default='')
    Attachment = models.FileField(upload_to='boq_attachments/', null=True, blank=True)

    class Meta:
        db_table = 'boq_approvedboq'
        ordering = ['BOQ_ID']

    def __str__(self):
        return f"BOQ {self.BOQ_ID} – {self.BOQ_Name}"
