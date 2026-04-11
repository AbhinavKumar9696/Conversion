from rest_framework import generics, status
from rest_framework.response import Response

from .models import ConvertedFile
from .serializers import ConvertedFileSerializer, FileConversionRequestSerializer
from .services import ConversionError, process_conversion


class ConvertedFileListCreateAPIView(generics.ListCreateAPIView):
    queryset = ConvertedFile.objects.order_by("-uploaded_at")

    def get_serializer_class(self):
        if self.request.method == "POST":
            return FileConversionRequestSerializer
        return ConvertedFileSerializer

    def create(self, request, *args, **kwargs):
        request_serializer = self.get_serializer(data=request.data)
        request_serializer.is_valid(raise_exception=True)
        conversion = request_serializer.save()

        try:
            process_conversion(conversion)
        except ConversionError:
            response_serializer = ConvertedFileSerializer(
                conversion,
                context={"request": request},
            )
            return Response(response_serializer.data, status=status.HTTP_422_UNPROCESSABLE_ENTITY)

        response_serializer = ConvertedFileSerializer(
            conversion,
            context={"request": request},
        )
        headers = self.get_success_headers(response_serializer.data)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED, headers=headers)


class ConvertedFileRetrieveAPIView(generics.RetrieveAPIView):
    queryset = ConvertedFile.objects.all()
    serializer_class = ConvertedFileSerializer
