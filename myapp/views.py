from django.shortcuts import render, redirect
from .forms import ReservationForm
from django.http import JsonResponse
from .models import Reservation
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
import json

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
        # Vérifier que l'utilisateur est authentifié
        if not request.user.is_authenticated:
            return JsonResponse({'message': 'Utilisateur non authentifié'}, status=401)

        try:
            data = json.loads(request.body)  # Récupère les données envoyées via AJAX

            # On crée un dictionnaire pour remplir le formulaire avec les données reçues
            form_data = {
                'resource': data.get('resource'),
                'date': data.get('date'),
                'assigned_user': request.user
            }

            # Remplir le formulaire avec les données, et associer l'utilisateur connecté
            form = ReservationForm(form_data)

            # Validation du formulaire
            if form.is_valid():
                reservation = form.save(commit=False)
                reservation.assigned_user = request.user  # On associe l'utilisateur connecté
                reservation.save()
                return JsonResponse({'message': 'Réservation réussie'}, status=200)

            # Si le formulaire n'est pas valide, renvoyer un message d'erreur
            return JsonResponse({'message': 'Erreur de validation des données'}, status=400)

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
