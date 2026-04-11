from django.urls import path
from .views import ConvertedFileListCreateAPIView, ConvertedFileRetrieveAPIView

urlpatterns = [
    path("api/conversions/", ConvertedFileListCreateAPIView.as_view(), name="conversion-list-create"),
    path("api/conversions/<int:pk>/", ConvertedFileRetrieveAPIView.as_view(), name="conversion-detail"),
]
