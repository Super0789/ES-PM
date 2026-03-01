from datetime import date
from decimal import Decimal

from django.db.models import Sum
from rest_framework import generics, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from accounts.permissions import IsAdminRole, IsEditorOrAbove, IsViewerOrAbove
from accounts.models import AuditLog
from .models import Payment
from .serializers import PaymentSerializer


def _log_audit(request, action_name, payment, changes=None):
    user = request.user if request and request.user.is_authenticated else None
    AuditLog.objects.create(
        user=user,
        action=action_name,
        model_name='Payment',
        object_id=str(payment.Payment_ID),
        changes=changes or {},
    )


class PaymentViewSet(ModelViewSet):
    serializer_class = PaymentSerializer
    filterset_fields = ['Project_number', 'Certified']

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [IsViewerOrAbove()]
        if self.action == 'destroy':
            return [IsAdminRole()]
        return [IsEditorOrAbove()]

    def get_queryset(self):
        return Payment.objects.select_related('Project_number').all()

    def perform_create(self, serializer):
        payment = serializer.save()
        _log_audit(self.request, 'create', payment, serializer.data)

    def perform_update(self, serializer):
        payment = serializer.save()
        _log_audit(self.request, 'update', payment, serializer.data)

    def perform_destroy(self, instance):
        _log_audit(self.request, 'delete', instance, {'Payment_ID': instance.Payment_ID})
        instance.delete()

    @action(detail=True, methods=['post'], url_path='certify', permission_classes=[IsEditorOrAbove])
    def certify(self, request, pk=None):
        """
        Certify a payment:
        1. Mark Certified=True, set Date_of_certification=today
        2. Assign to next free Payment_X slot on the project
        3. Recalculate Overall_Received_Payments on the project
        """
        payment = self.get_object()
        if payment.Certified:
            return Response({'detail': 'Payment is already certified.'}, status=status.HTTP_400_BAD_REQUEST)

        project = payment.Project_number
        # Find next available slot
        slot = None
        for i in range(1, 15):
            slot_value = getattr(project, f'Payment_{i}', Decimal('0'))
            if not slot_value or slot_value == Decimal('0'):
                slot = i
                break

        if slot is None:
            return Response({'detail': 'All 14 payment slots are already filled.'}, status=status.HTTP_400_BAD_REQUEST)

        # Update payment
        payment.Certified = True
        payment.Date_of_certification = date.today()
        payment.Payment_Slot = slot
        payment.save()

        # Fill the slot on the project
        setattr(project, f'Payment_{slot}', payment.Payment_value)

        # Recalculate Overall_Received_Payments
        total = Decimal('0')
        for i in range(1, 15):
            total += getattr(project, f'Payment_{i}', Decimal('0')) or Decimal('0')
        project.Overall_Received_Payments = total
        project.save()

        _log_audit(request, 'update', payment, {
            'action': 'certify',
            'slot': slot,
            'value': str(payment.Payment_value),
        })

        serializer = self.get_serializer(payment)
        return Response(serializer.data)
