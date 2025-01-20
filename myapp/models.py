from django.db import models
from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.db.models import TextField

# permet de remplacer les JSONField par des TextField car sqlite de gère pas les JSONField
if settings.DATABASES['default']['ENGINE'] == 'django.db.backends.sqlite3':
    CustomJSONField = TextField  # Remplace JSONField par TextField pour SQLite
else:
    from django.db.models import JSONField
    CustomJSONField = JSONField


class Reservation(models.Model):
    assigned_user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    resource = models.CharField(max_length=100)
    date = models.DateField()

# AbstractUser hérite de User de Django.allauth et permet de personnalier USer (ici on ajoute 2 champs non présents par défaut)
class User(AbstractUser):
    institute = models.CharField(max_length=100, blank=True, null=True)
    laboratory = models.CharField(max_length=100, blank=True, null=True)


class ReservationDetails(models.Model):
    reservation = models.OneToOneField('Reservation', on_delete=models.CASCADE, related_name='details')
    sample_name = models.CharField(max_length=255)
    materials = models.CharField(max_length=255)
    micro_meso_non_porous = models.CharField(max_length=50, choices=[('Micro', 'Micro'), ('Meso', 'Meso'), ('Non Porous', 'Non Porous')])
    estimated_surface_area = models.FloatField()
    degassing_temperature = models.FloatField()

    def __str__(self):
        return f"Details for Reservation {self.reservation.id}"