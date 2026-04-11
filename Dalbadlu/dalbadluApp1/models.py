from django.db import models

class ConvertedFile(models.Model):
    class ConversionType(models.TextChoices):
        WORD_TO_PDF = "word_to_pdf", "Word to PDF"
        PDF_TO_WORD = "pdf_to_word", "PDF to Word"

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        PROCESSING = "processing", "Processing"
        COMPLETED = "completed", "Completed"
        FAILED = "failed", "Failed"

    original_file = models.FileField(upload_to='original/')
    converted_file = models.FileField(upload_to='converted/', blank=True, null=True)
    conversion_type = models.CharField(
        max_length=20,
        choices=ConversionType.choices,
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )
    error_message = models.TextField(blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(blank=True, null=True)

    def __str__(self):
        return f"{self.id}:{self.conversion_type}:{self.status}"
