from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('attachments', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='attachment',
            name='Field_name',
            field=models.CharField(max_length=255),
        ),
        migrations.AlterField(
            model_name='attachment',
            name='File_path',
            field=models.FileField(max_length=500, upload_to='attachments/'),
        ),
    ]
