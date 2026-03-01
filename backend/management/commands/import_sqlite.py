"""
Management command to import data from an existing SQLite database
(project_management.db) into the Django application database.

Usage:
    python manage.py import_sqlite --sqlite-path /path/to/project_management.db
"""
import sqlite3
from datetime import datetime, date
from decimal import Decimal, InvalidOperation

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction


def _parse_date(value):
    """Try to parse a date value from various formats."""
    if not value:
        return None
    if isinstance(value, (date, datetime)):
        return value.date() if isinstance(value, datetime) else value
    s = str(value).strip()
    if not s:
        return None
    for fmt in ('%Y-%m-%d', '%d/%m/%Y', '%m/%d/%Y', '%d-%m-%Y', '%Y/%m/%d'):
        try:
            return datetime.strptime(s, fmt).date()
        except ValueError:
            continue
    return None


def _parse_decimal(value, default=Decimal('0')):
    if value is None:
        return default
    try:
        return Decimal(str(value))
    except InvalidOperation:
        return default


def _parse_bool(value):
    if isinstance(value, bool):
        return value
    if isinstance(value, int):
        return bool(value)
    if isinstance(value, str):
        return value.strip().lower() in ('1', 'true', 'yes')
    return False


class Command(BaseCommand):
    help = 'Import data from an existing SQLite database (project_management.db)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--sqlite-path',
            required=True,
            help='Absolute path to the source SQLite database file.',
        )
        parser.add_argument(
            '--skip-existing',
            action='store_true',
            default=True,
            help='Skip records that already exist in the target database (default: True).',
        )

    def handle(self, *args, **options):
        from projects.models import Project
        from payments.models import Payment
        from attachments.models import Attachment
        from boq.models import ApprovedBOQ

        sqlite_path = options['sqlite_path']
        skip_existing = options['skip_existing']

        try:
            conn = sqlite3.connect(sqlite_path)
            conn.row_factory = sqlite3.Row
        except Exception as e:
            raise CommandError(f'Cannot open SQLite database: {e}')

        cursor = conn.cursor()

        # ── Discover available tables ─────────────────────────────────────
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        available_tables = {row['name'] for row in cursor.fetchall()}
        self.stdout.write(f'Tables found: {", ".join(sorted(available_tables))}')

        with transaction.atomic():
            self._import_projects(cursor, available_tables, Project, skip_existing)
            self._import_payments(cursor, available_tables, Payment, Project, skip_existing)
            self._import_boq(cursor, available_tables, ApprovedBOQ, Project, skip_existing)
            self._import_attachments(cursor, available_tables, Attachment, Project, Payment, skip_existing)

        conn.close()
        self.stdout.write(self.style.SUCCESS('Import completed successfully.'))

    # ── Projects ──────────────────────────────────────────────────────────

    def _import_projects(self, cursor, tables, Project, skip_existing):
        # Try common table names
        table = self._find_table(tables, ['projects_project', 'projects', 'project', 'Projects'])
        if not table:
            self.stdout.write(self.style.WARNING('No projects table found – skipping.'))
            return

        cursor.execute(f'SELECT * FROM "{table}"')
        rows = cursor.fetchall()
        created = skipped = 0

        for row in rows:
            r = dict(row)
            pnum = str(r.get('Project_number') or r.get('project_number') or '').strip()
            if not pnum:
                continue

            if skip_existing and Project.objects.filter(pk=pnum).exists():
                skipped += 1
                continue

            # Map all known fields, falling back to sensible defaults
            defaults = dict(
                Project_Name=str(r.get('Project_Name') or r.get('project_name') or ''),
                Client=str(r.get('Client') or r.get('client') or ''),
                Contract_number=str(r.get('Contract_number') or r.get('contract_number') or ''),
                Main_Contract_Value=_parse_decimal(r.get('Main_Contract_Value') or r.get('main_contract_value')),
                percent_Physical_Completed=_parse_decimal(r.get('percent_Physical_Completed') or r.get('percent_physical_completed')),
                Overall_Received_Payments=_parse_decimal(r.get('Overall_Received_Payments') or r.get('overall_received_payments')),
                Initial_Handing_Over_Status=str(r.get('Initial_Handing_Over_Status') or ''),
                Project_Finished=str(r.get('Project_Finished') or 'No'),
                Final_Handing_Over_Status=str(r.get('Final_Handing_Over_Status') or ''),
                Project_Manager=str(r.get('Project_Manager') or r.get('project_manager') or ''),
                Initial_Handing_Over_Letter=_parse_date(r.get('Initial_Handing_Over_Letter')),
                Initial_Handing_Over_Comments_Letter=str(r.get('Initial_Handing_Over_Comments_Letter') or ''),
                Initial_Handing_Over_Date=_parse_date(r.get('Initial_Handing_Over_Date')),
                Final_Handing_Over_Letter=_parse_date(r.get('Final_Handing_Over_Letter')),
                Final_Handing_Over_Comments_Letter=str(r.get('Final_Handing_Over_Comments_Letter') or ''),
                Final_Handing_Over_Date=_parse_date(r.get('Final_Handing_Over_Date')),
                Starting_Order=_parse_date(r.get('Starting_Order')),
                Project_Duration_Days=r.get('Project_Duration_Days'),
                Project_End_date=_parse_date(r.get('Project_End_date') or r.get('Project_End_Date')),
            )

            # Variations
            for i in range(1, 8):
                defaults[f'Variation_{i}'] = _parse_decimal(r.get(f'Variation_{i}'))

            # Payments
            for i in range(1, 15):
                defaults[f'Payment_{i}'] = _parse_decimal(r.get(f'Payment_{i}'))

            Project.objects.update_or_create(Project_number=pnum, defaults=defaults)
            created += 1

        self.stdout.write(f'Projects: {created} imported, {skipped} skipped.')

    # ── Payments ──────────────────────────────────────────────────────────

    def _import_payments(self, cursor, tables, Payment, Project, skip_existing):
        table = self._find_table(tables, ['payments_payment', 'payments', 'payment', 'Payments'])
        if not table:
            self.stdout.write(self.style.WARNING('No payments table found – skipping.'))
            return

        cursor.execute(f'SELECT * FROM "{table}"')
        rows = cursor.fetchall()
        created = skipped = errors = 0

        for row in rows:
            r = dict(row)
            payment_id = r.get('Payment_ID') or r.get('payment_id')
            pnum = str(r.get('Project_number') or r.get('project_number') or '').strip()

            if skip_existing and payment_id and Payment.objects.filter(pk=payment_id).exists():
                skipped += 1
                continue

            try:
                project = Project.objects.get(pk=pnum)
            except Project.DoesNotExist:
                self.stdout.write(self.style.WARNING(f'  Project {pnum!r} not found – skipping payment {payment_id}.'))
                errors += 1
                continue

            obj = Payment(
                Project_number=project,
                Payment_value=_parse_decimal(r.get('Payment_value') or r.get('payment_value')),
                Date_of_submission=_parse_date(r.get('Date_of_submission')),
                Certified=_parse_bool(r.get('Certified')),
                Date_of_certification=_parse_date(r.get('Date_of_certification')),
                Payment_Slot=r.get('Payment_Slot'),
            )
            if payment_id:
                obj.Payment_ID = payment_id
            obj.save()
            created += 1

        self.stdout.write(f'Payments: {created} imported, {skipped} skipped, {errors} errors.')

    # ── BOQ ───────────────────────────────────────────────────────────────

    def _import_boq(self, cursor, tables, ApprovedBOQ, Project, skip_existing):
        table = self._find_table(tables, ['boq_approvedboq', 'boq', 'approved_boq', 'ApprovedBOQ'])
        if not table:
            self.stdout.write(self.style.WARNING('No BOQ table found – skipping.'))
            return

        cursor.execute(f'SELECT * FROM "{table}"')
        rows = cursor.fetchall()
        created = skipped = errors = 0

        for row in rows:
            r = dict(row)
            boq_id = r.get('BOQ_ID') or r.get('boq_id')
            pnum = str(r.get('Project_number') or r.get('project_number') or '').strip()

            if skip_existing and boq_id and ApprovedBOQ.objects.filter(pk=boq_id).exists():
                skipped += 1
                continue

            try:
                project = Project.objects.get(pk=pnum)
            except Project.DoesNotExist:
                self.stdout.write(self.style.WARNING(f'  Project {pnum!r} not found – skipping BOQ {boq_id}.'))
                errors += 1
                continue

            obj = ApprovedBOQ(
                Project_number=project,
                BOQ_Name=str(r.get('BOQ_Name') or r.get('boq_name') or ''),
                Value=_parse_decimal(r.get('Value') or r.get('value')),
                Comments=str(r.get('Comments') or r.get('comments') or ''),
            )
            if boq_id:
                obj.BOQ_ID = boq_id
            obj.save()
            created += 1

        self.stdout.write(f'BOQ items: {created} imported, {skipped} skipped, {errors} errors.')

    # ── Attachments ───────────────────────────────────────────────────────

    def _import_attachments(self, cursor, tables, Attachment, Project, Payment, skip_existing):
        table = self._find_table(tables, ['attachments_attachment', 'attachments', 'attachment', 'Attachments'])
        if not table:
            self.stdout.write(self.style.WARNING('No attachments table found – skipping.'))
            return

        cursor.execute(f'SELECT * FROM "{table}"')
        rows = cursor.fetchall()
        created = skipped = errors = 0

        for row in rows:
            r = dict(row)
            att_id = r.get('Attachment_ID') or r.get('attachment_id')
            pnum = str(r.get('Project_number') or r.get('project_number') or '').strip()

            if skip_existing and att_id and Attachment.objects.filter(pk=att_id).exists():
                skipped += 1
                continue

            try:
                project = Project.objects.get(pk=pnum)
            except Project.DoesNotExist:
                self.stdout.write(self.style.WARNING(f'  Project {pnum!r} not found – skipping attachment {att_id}.'))
                errors += 1
                continue

            payment_id = r.get('Payment_ID') or r.get('payment_id')
            payment = None
            if payment_id:
                try:
                    payment = Payment.objects.get(pk=payment_id)
                except Payment.DoesNotExist:
                    pass

            file_path = str(r.get('File_path') or r.get('file_path') or '')

            obj = Attachment(
                Project_number=project,
                Payment_ID=payment,
                Field_name=str(r.get('Field_name') or r.get('field_name') or ''),
                File_path=file_path,
            )
            if att_id:
                obj.Attachment_ID = att_id
            obj.save()
            created += 1

        self.stdout.write(f'Attachments: {created} imported, {skipped} skipped, {errors} errors.')

    # ── Helpers ───────────────────────────────────────────────────────────

    @staticmethod
    def _find_table(available, candidates):
        for name in candidates:
            if name in available:
                return name
        return None
