from django.db import models

# Create your models here.
class ConvertedFile(models.Model):
    original_file = models.FileField(upload_to='original/')
    converted_file = models.FileField(upload_to='converted/')
    conversion_type = models.CharField(max_length=20)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.conversion_type