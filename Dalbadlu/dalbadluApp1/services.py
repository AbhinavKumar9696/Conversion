import logging
import os
from pathlib import Path

from django.db import transaction
from django.utils import timezone

from .models import ConvertedFile

logger = logging.getLogger(__name__)


class ConversionError(Exception):
    pass


def _build_output_path(input_path, conversion_type):
    path = Path(input_path)
    output_dir = path.parent.parent / "converted"
    output_dir.mkdir(parents=True, exist_ok=True)

    if conversion_type == ConvertedFile.ConversionType.WORD_TO_PDF:
        return str(output_dir / f"{path.stem}.pdf")

    if conversion_type == ConvertedFile.ConversionType.PDF_TO_WORD:
        return str(output_dir / f"{path.stem}.docx")

    raise ConversionError("Unsupported conversion type.")


def _convert_word_to_pdf(input_path, output_path):
    try:
        from docx2pdf import convert
    except ImportError as exc:
        raise ConversionError("docx2pdf is not installed.") from exc

    convert(input_path, output_path)


def _convert_pdf_to_word(input_path, output_path):
    try:
        from pdf2docx import Converter
    except ImportError as exc:
        raise ConversionError("pdf2docx is not installed.") from exc

    converter = Converter(input_path)
    try:
        converter.convert(output_path)
    finally:
        converter.close()


def process_conversion(conversion: ConvertedFile) -> ConvertedFile:
    input_path = conversion.original_file.path
    output_path = _build_output_path(input_path, conversion.conversion_type)

    conversion.status = ConvertedFile.Status.PROCESSING
    conversion.error_message = ""
    conversion.completed_at = None
    conversion.save(update_fields=["status", "error_message", "completed_at"])

    try:
        if conversion.conversion_type == ConvertedFile.ConversionType.WORD_TO_PDF:
            _convert_word_to_pdf(input_path, output_path)
        else:
            _convert_pdf_to_word(input_path, output_path)

        if not os.path.exists(output_path):
            raise ConversionError("Conversion finished without producing an output file.")

        relative_path = Path(output_path).relative_to(conversion.original_file.storage.location)

        with transaction.atomic():
            conversion.converted_file.name = str(relative_path).replace("\\", "/")
            conversion.status = ConvertedFile.Status.COMPLETED
            conversion.error_message = ""
            conversion.completed_at = timezone.now()
            conversion.save(
                update_fields=[
                    "converted_file",
                    "status",
                    "error_message",
                    "completed_at",
                ]
            )

    except Exception as exc:
        logger.exception("Conversion failed for ConvertedFile id=%s", conversion.id)

        if os.path.exists(output_path):
            os.remove(output_path)

        conversion.status = ConvertedFile.Status.FAILED
        conversion.error_message = str(exc)
        conversion.completed_at = timezone.now()
        conversion.save(update_fields=["status", "error_message", "completed_at"])
        raise ConversionError(str(exc)) from exc

    return conversion
