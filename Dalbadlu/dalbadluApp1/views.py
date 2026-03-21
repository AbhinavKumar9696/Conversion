import os
from django.shortcuts import render
from django.conf import settings
from dalbadluApp1.froms import FileConvertForm
from .models import ConvertedFile

from docx2pdf import convert
from pdf2docx import Converter


def convert_file(request):
    message = ""
    file_url = None   # 👈 NEW

    if request.method == 'POST':
        form = FileConvertForm(request.POST, request.FILES)
        if form.is_valid():
            conversion_type = form.cleaned_data['conversion_type']
            uploaded_file = request.FILES['original_file']

            file_instance = ConvertedFile.objects.create(
                original_file=uploaded_file,
                conversion_type=conversion_type
            )

            input_path = file_instance.original_file.path

            if conversion_type == 'word_to_pdf':
                if not input_path.endswith('.docx'):
                    message = "Please upload a Word file (.docx)"
                else:
                    output_path = input_path.replace('.docx', '.pdf')
                    convert(input_path, output_path)

            elif conversion_type == 'pdf_to_word':
                if not input_path.endswith('.pdf'):
                    message = "Please upload a PDF file"
                else:
                    output_path = input_path.replace('.pdf', '.docx')
                    cv = Converter(input_path)
                    cv.convert(output_path)
                    cv.close()

            # Save and prepare download
            if 'output_path' in locals() and os.path.exists(output_path):
                relative_path = output_path.replace(settings.MEDIA_ROOT + '/', '')
                file_instance.converted_file.name = relative_path
                file_instance.save()

                file_url = settings.MEDIA_URL + relative_path   # 👈 IMPORTANT
                message = "File converted successfully!"

    else:
        form = FileConvertForm()

    return render(request, 'convert.html', {
        'form': form,
        'message': message,
        'file_url': file_url   # 👈 PASS TO TEMPLATE
    })