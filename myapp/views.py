from django.shortcuts import render, redirect
from .forms import ReservationForm
from .forms import ContactForm
from django.http import JsonResponse
from .models import Reservation, ReservationDetails
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
import json
from django.core.mail import send_mail
from django.contrib import messages


def index(request):
    return render(request, 'index.html')


@login_required
@csrf_exempt
def delete_reservation(request, reservation_id):
    try:
        reservation = Reservation.objects.get(id=reservation_id, assigned_user=request.user)
        reservation.delete()
        return JsonResponse({'message': 'Réservation annulée avec succès'})
    except Reservation.DoesNotExist:
        return JsonResponse({'error': 'Réservation introuvable ou non autorisée'}, status=403)


@csrf_exempt  # Désactive temporairement la protection CSRF pour cette vue, à utiliser avec prudence
# @login_required
def create_reservation_ajax(request):
    if request.method == 'POST':
        if not request.user.is_authenticated:
            return JsonResponse({'message': 'Utilisateur non authentifié'}, status=401)

        try:
            data = json.loads(request.body)

            # Créer la réservation principale
            reservation = Reservation.objects.create(
                resource=data.get('resource'),
                date=data.get('date'),
                assigned_user=request.user,
            )

            # Créer les détails de réservation
            ReservationDetails.objects.create(
                reservation=reservation,
                sample_name=data.get('sample_name'),
                materials=data.get('materials'),
                micro_meso_non_porous=data.get('micro_meso_non_porous'),
                estimated_surface_area=data.get('estimated_surface_area'),
                degassing_temperature=data.get('degassing_temperature'),
            )

            return JsonResponse({'message': 'Réservation réussie'}, status=200)

        except Exception as e:
            return JsonResponse({'message': f'Erreur lors de la création de la réservation: {str(e)}'}, status=400)
    else:
        return JsonResponse({'message': 'Méthode non autorisée'}, status=405)

def calendar_view(request):
    return render(request, 'calendar.html')

def get_reservations(request):
    reservations = Reservation.objects.all()

    events = []
    for reservation in reservations:
        events.append({
            'id': reservation.id,
            'title': reservation.assigned_user.username,  # Nom de l'utilisateur
            'start': str(reservation.date),               # Date de la réservation
            'end': str(reservation.date),                 # Fin de la réservation (un jour complet)
            'description': f'Resérvation de {reservation.assigned_user.username}',  # Description de la réservation
            'resource' : reservation.resource,
            'isOwner': reservation.assigned_user == request.user,
            # 'backgroundColor': 'red',                     # Couleur de fond
            # 'borderColor': 'red',
        })

    return JsonResponse(events, safe=False)


def contact_view(request):
    if request.method == "POST":
        form = ContactForm(request.POST)
        if form.is_valid():
            # Traitement du formulaire
            name = form.cleaned_data["name"]
            email = form.cleaned_data["email"]
            message = form.cleaned_data["message"]
            
            # Envoi de l'email
            send_mail(
                subject=f"Nouveau message de {name}",
                message=message,
                from_email=email,
                recipient_list=["nicolas.donzel@umontpellier.fr"],
            )
            messages.success(request, "Votre message a bien été envoyé !")
            return redirect("contact")  # Recharge la page avec le message
    else:
        form = ContactForm()

    return render(request, "sections/contact.html", {"form": form})




