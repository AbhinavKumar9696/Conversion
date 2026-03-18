from django.contrib import admin
from django.urls import path
from dalbadluApp1 import views

urlpatterns = [
    path('',views.home_view,name="home"),
]
