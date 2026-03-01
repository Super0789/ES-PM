import django_filters
from django.db.models import Q
from .models import Project


class ProjectFilter(django_filters.FilterSet):
    client = django_filters.CharFilter(field_name='Client', lookup_expr='iexact')
    project_manager = django_filters.CharFilter(field_name='Project_Manager', lookup_expr='iexact')
    year = django_filters.CharFilter(method='filter_by_year')
    remaining_10 = django_filters.CharFilter(method='filter_remaining_10')
    initial_ho_pending = django_filters.CharFilter(method='filter_initial_ho_pending')
    final_ho_pending = django_filters.CharFilter(method='filter_final_ho_pending')
    payment_pending = django_filters.CharFilter(method='filter_payment_pending')
    discrepancy = django_filters.CharFilter(method='filter_discrepancy')
    show_completed = django_filters.CharFilter(method='filter_show_completed')

    class Meta:
        model = Project
        fields = ['client', 'project_manager', 'year', 'remaining_10',
                  'initial_ho_pending', 'final_ho_pending', 'payment_pending',
                  'discrepancy', 'show_completed']

    def filter_by_year(self, queryset, name, value):
        return queryset.filter(Project_number__startswith=value)

    def filter_remaining_10(self, queryset, name, value):
        # percent_Physical_Completed is stored as 0..1 (e.g. 0.9 = 90%).
        # "remaining_10" means ≥ 10 % remaining, i.e. physical completion ≤ 90 %.
        if value.lower() == 'true':
            return queryset.filter(percent_Physical_Completed__lte=0.9)
        return queryset

    def filter_initial_ho_pending(self, queryset, name, value):
        if value.lower() == 'true':
            return queryset.filter(Initial_Handing_Over_Status='Pending')
        return queryset

    def filter_final_ho_pending(self, queryset, name, value):
        if value.lower() == 'true':
            return queryset.filter(Final_Handing_Over_Status='Pending')
        return queryset

    def filter_payment_pending(self, queryset, name, value):
        if value.lower() == 'true':
            return queryset.filter(payments__Certified=False).distinct()
        return queryset

    def filter_discrepancy(self, queryset, name, value):
        if value.lower() == 'true':
            # ABS((Overall_Received_Payments / Main_Contract_Value) - 1) * 100 >= 6
            # Handled in Python after queryset fetch when Main_Contract_Value > 0
            pks = []
            for p in queryset.filter(Main_Contract_Value__gt=0):
                ratio = float(p.Overall_Received_Payments) / float(p.Main_Contract_Value)
                if abs(ratio - 1) * 100 >= 6:
                    pks.append(p.pk)
            return queryset.filter(pk__in=pks)
        return queryset

    def filter_show_completed(self, queryset, name, value):
        if value.lower() != 'true':
            return queryset.exclude(Project_Finished='Yes')
        return queryset
