from django.db import models


class Payment(models.Model):
    Payment_ID = models.AutoField(primary_key=True)
    Project_number = models.ForeignKey(
        'projects.Project',
        on_delete=models.CASCADE,
        related_name='payments',
        db_column='Project_number',
    )
    Payment_value = models.DecimalField(max_digits=15, decimal_places=2)
    Date_of_submission = models.DateField(null=True, blank=True)
    Certified = models.BooleanField(default=False)
    Date_of_certification = models.DateField(null=True, blank=True)
    Payment_Slot = models.IntegerField(null=True, blank=True)  # 1-14

    class Meta:
        db_table = 'payments_payment'
        ordering = ['-Payment_ID']

    def __str__(self):
        return f"Payment {self.Payment_ID} – {self.Project_number_id} – {self.Payment_value}"
