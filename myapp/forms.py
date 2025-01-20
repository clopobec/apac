
from allauth.account.forms import SignupForm
from django import forms
from .models import Reservation
from .models import ReservationDetails

print("CustomSignupForm est chargé")

class CustomSignupForm(SignupForm):
    first_name = forms.CharField(max_length=30, label='Prénom')
    last_name = forms.CharField(max_length=30, label='Nom')
    institute = forms.CharField(max_length=100, label='Institut')
    laboratory = forms.CharField(max_length=100, label='Laboratoire')
    email = forms.EmailField(max_length=100, label='E-mail')

    def clean_password1(self):
        password1 = self.cleaned_data.get('password1')
        # Vous pouvez ici ajouter votre propre logique de validation ou simplement renvoyer le mot de passe sans validation
        return password1

    def save(self, request):
        user = super(CustomSignupForm, self).save(request)
        user.first_name = self.cleaned_data['first_name']
        user.last_name = self.cleaned_data['last_name']
        user.institute = self.cleaned_data['institute']
        user.laboratory = self.cleaned_data['laboratory']
        user.email = self.cleaned_data['email']
        user.save()
        return user

class ReservationForm(forms.ModelForm):
    class Meta:
        model = Reservation
        fields = ['resource', 'date']  # Inclure uniquement les champs que vous souhaitez exposer
        widgets = {
            'date': forms.DateInput(attrs={'type': 'date'}),
        }


class ReservationDetailsForm(forms.ModelForm):
    class Meta:
        model = ReservationDetails
        fields = ['sample_name', 'materials', 'micro_meso_non_porous', 'estimated_surface_area', 'degassing_temperature']