from pathlib import Path

from django.db import transaction
from rest_framework import serializers

from .models import ConvertedFile


class ConvertedFileSerializer(serializers.ModelSerializer):
    original_file_url = serializers.SerializerMethodField()
    converted_file_url = serializers.SerializerMethodField()

    class Meta:
        model = ConvertedFile
        fields = [
            "id",
            "conversion_type",
            "status",
            "error_message",
            "uploaded_at",
            "completed_at",
            "original_file_url",
            "converted_file_url",
        ]
        read_only_fields = fields

    def _build_url(self, file_field):
        if not file_field:
            return None
        request = self.context.get("request")
        url = file_field.url
        return request.build_absolute_uri(url) if request else url

    def get_original_file_url(self, obj):
        return self._build_url(obj.original_file)

    def get_converted_file_url(self, obj):
        return self._build_url(obj.converted_file)


class FileConversionRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConvertedFile
        fields = ["id", "conversion_type", "original_file"]
        read_only_fields = ["id"]

    def validate(self, attrs):
        uploaded_file = attrs["original_file"]
        conversion_type = attrs["conversion_type"]
        extension = Path(uploaded_file.name).suffix.lower()

        expected_extensions = {
            ConvertedFile.ConversionType.WORD_TO_PDF: ".docx",
            ConvertedFile.ConversionType.PDF_TO_WORD: ".pdf",
        }

        if extension != expected_extensions[conversion_type]:
            raise serializers.ValidationError(
                {
                    "original_file": (
                        f"Expected a {expected_extensions[conversion_type]} file "
                        f"for '{conversion_type}'."
                    )
                }
            )

        return attrs

    def create(self, validated_data):
        with transaction.atomic():
            return ConvertedFile.objects.create(
                **validated_data,
                status=ConvertedFile.Status.PENDING,
            )
