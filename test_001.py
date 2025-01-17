from myapp.models import Reservation
for reservation in Reservation.objects.all():
    print(reservation)