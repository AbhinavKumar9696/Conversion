from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("dalbadluApp1", "0002_convertedfile_delete_uploadedfile"),
    ]

    operations = [
        migrations.AlterField(
            model_name="convertedfile",
            name="conversion_type",
            field=models.CharField(
                choices=[("word_to_pdf", "Word to PDF"), ("pdf_to_word", "PDF to Word")],
                max_length=20,
            ),
        ),
        migrations.AlterField(
            model_name="convertedfile",
            name="converted_file",
            field=models.FileField(blank=True, null=True, upload_to="converted/"),
        ),
        migrations.AddField(
            model_name="convertedfile",
            name="completed_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="convertedfile",
            name="error_message",
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name="convertedfile",
            name="status",
            field=models.CharField(
                choices=[
                    ("pending", "Pending"),
                    ("processing", "Processing"),
                    ("completed", "Completed"),
                    ("failed", "Failed"),
                ],
                default="pending",
                max_length=20,
            ),
        ),
    ]
