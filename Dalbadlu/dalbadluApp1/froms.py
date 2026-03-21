from django import forms
from .models import ConvertedFile

class FileConvertForm(forms.ModelForm):
    CONVERSION_CHOICES = [
        ('word_to_pdf', 'Word to PDF'),
        ('pdf_to_word', 'PDF to Word'),
    ]

    conversion_type = forms.ChoiceField(
        choices=CONVERSION_CHOICES,
        widget=forms.RadioSelect  # looks better than checkbox
    )

    class Meta:
        model = ConvertedFile
        fields = ['conversion_type', 'original_file']