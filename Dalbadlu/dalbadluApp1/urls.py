from django.urls import path
from .views import convert_file

urlpatterns = [
    path('', convert_file, name='convert_file'),
]