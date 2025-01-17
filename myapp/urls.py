from django.urls import path
from . import views
from django.contrib.auth import views as auth_views

urlpatterns = [
    path('', views.index, name='index'),
    path('create_reservation_ajax/', views.create_reservation_ajax, name='create_reservation_ajax'),
    path('calendar/', views.calendar_view, name='calendar'),
    path('accounts/logout/', auth_views.LogoutView.as_view(), name='account_logout'),
    path('get_reservations/', views.get_reservations, name='get_reservations'),
    path('delete_reservation/<int:reservation_id>/', views.delete_reservation, name='delete_reservation'),
    
    
    
]

