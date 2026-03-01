from django.db import models
from datetime import date


class Project(models.Model):
    HANDING_OVER_CHOICES = [('Pending', 'Pending'), ('Done', 'Done'), ('', '')]
    FINISHED_CHOICES = [('Yes', 'Yes'), ('No', 'No')]
    PM_CHOICES = [
        ('Ali', 'Ali'), ('Khalid', 'Khalid'), ('Mahmoud', 'Mahmoud'),
        ('Reyad', 'Reyad'), ('MEP', 'MEP'), ('Other', 'Other'), ('', ''),
    ]

    Project_number = models.CharField(max_length=20, primary_key=True)
    Project_Name = models.CharField(max_length=255)
    Client = models.CharField(max_length=255, blank=True, default='')
    Contract_number = models.CharField(max_length=100, blank=True, default='')
    Main_Contract_Value = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    percent_Physical_Completed = models.DecimalField(max_digits=5, decimal_places=4, default=0)
    Overall_Received_Payments = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    Initial_Handing_Over_Status = models.CharField(
        max_length=20, choices=HANDING_OVER_CHOICES, blank=True, default='')
    Project_Finished = models.CharField(max_length=3, choices=FINISHED_CHOICES, default='No')
    Variation_1 = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    Variation_2 = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    Variation_3 = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    Variation_4 = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    Variation_5 = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    Variation_6 = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    Variation_7 = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    Payment_1 = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    Payment_2 = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    Payment_3 = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    Payment_4 = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    Payment_5 = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    Payment_6 = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    Payment_7 = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    Payment_8 = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    Payment_9 = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    Payment_10 = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    Payment_11 = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    Payment_12 = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    Payment_13 = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    Payment_14 = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    Initial_Handing_Over_Letter = models.DateField(null=True, blank=True)
    Initial_Handing_Over_Comments_Letter = models.TextField(blank=True, default='')
    Initial_Handing_Over_Date = models.DateField(null=True, blank=True)
    Final_Handing_Over_Letter = models.DateField(null=True, blank=True)
    Final_Handing_Over_Comments_Letter = models.TextField(blank=True, default='')
    Final_Handing_Over_Status = models.CharField(
        max_length=20, choices=HANDING_OVER_CHOICES, blank=True, default='')
    Final_Handing_Over_Date = models.DateField(null=True, blank=True)
    Project_Manager = models.CharField(max_length=50, choices=PM_CHOICES, blank=True, default='')
    Starting_Order = models.DateField(null=True, blank=True)
    Project_Duration_Days = models.IntegerField(null=True, blank=True)
    Project_End_date = models.DateField(null=True, blank=True)

    class Meta:
        db_table = 'projects_project'
        ordering = ['-Project_number']

    def __str__(self):
        return f"{self.Project_number} – {self.Project_Name}"

    # ── Calculated properties ──────────────────────────────────────────────

    @property
    def overall_project_value(self):
        total = self.Main_Contract_Value
        for i in range(1, 8):
            total += getattr(self, f'Variation_{i}', 0) or 0
        return total

    @property
    def financial_percent_completed(self):
        opv = self.overall_project_value
        if not opv:
            return 0
        pct = float(self.Overall_Received_Payments) / float(opv)
        return min(pct, 1.0)

    @property
    def remaining_percent(self):
        return 1.0 - self.financial_percent_completed

    @property
    def deadline(self):
        if self.Project_End_date:
            return self.Project_End_date
        if self.Starting_Order and self.Project_Duration_Days:
            from datetime import timedelta
            return self.Starting_Order + timedelta(days=self.Project_Duration_Days)
        return None

    @property
    def is_overdue(self):
        dl = self.deadline
        if dl is None:
            return False
        # Not overdue when handover is formally initiated ('Pending') –
        # the project is in the hand-over transition and the deadline
        # extension is expected.  Only flag overdue when the status is
        # still '' (not initiated) and the project is past its deadline.
        return (
            dl < date.today()
            and self.Project_Finished != 'Yes'
            and self.Initial_Handing_Over_Status != 'Pending'
        )
