import tempfile
from pathlib import Path
from unittest.mock import patch

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from .models import ConvertedFile


@override_settings(MEDIA_ROOT=tempfile.gettempdir())
class ConversionAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()

    @patch("dalbadluApp1.services._convert_word_to_pdf")
    def test_create_conversion_completes_successfully(self, mock_convert):
        def fake_convert(input_path, output_path):
            Path(output_path).write_bytes(b"%PDF-1.4 test output")

        mock_convert.side_effect = fake_convert

        response = self.client.post(
            "/api/conversions/",
            data={
                "conversion_type": ConvertedFile.ConversionType.WORD_TO_PDF,
                "original_file": SimpleUploadedFile(
                    "sample.docx",
                    b"fake docx content",
                    content_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                ),
            },
            format="multipart",
        )

        self.assertEqual(response.status_code, 201)
        conversion = ConvertedFile.objects.get()
        self.assertEqual(conversion.status, ConvertedFile.Status.COMPLETED)
        self.assertTrue(bool(conversion.converted_file))
        self.assertEqual(response.data["status"], ConvertedFile.Status.COMPLETED)

    def test_create_conversion_rejects_wrong_extension(self):
        response = self.client.post(
            "/api/conversions/",
            data={
                "conversion_type": ConvertedFile.ConversionType.WORD_TO_PDF,
                "original_file": SimpleUploadedFile(
                    "wrong.pdf",
                    b"%PDF-1.4",
                    content_type="application/pdf",
                ),
            },
            format="multipart",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(ConvertedFile.objects.count(), 0)

    @patch("dalbadluApp1.services._convert_pdf_to_word")
    def test_create_conversion_marks_failed_status(self, mock_convert):
        mock_convert.side_effect = RuntimeError("conversion engine blew up")

        response = self.client.post(
            "/api/conversions/",
            data={
                "conversion_type": ConvertedFile.ConversionType.PDF_TO_WORD,
                "original_file": SimpleUploadedFile(
                    "sample.pdf",
                    b"%PDF-1.4",
                    content_type="application/pdf",
                ),
            },
            format="multipart",
        )

        self.assertEqual(response.status_code, 422)
        conversion = ConvertedFile.objects.get()
        self.assertEqual(conversion.status, ConvertedFile.Status.FAILED)
        self.assertIn("conversion engine blew up", conversion.error_message)
