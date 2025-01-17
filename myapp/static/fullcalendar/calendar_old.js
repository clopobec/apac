document.addEventListener('DOMContentLoaded', function () {
    const calendarEl = document.getElementById('calendar');
    const reservationModal = document.getElementById('reservationModal');
    const resourceButtons = document.querySelectorAll('.resource-btn');
    const submitButton = document.querySelector('#reservationForm input[type="submit"]');
    let selectedResource = null; // Variable pour stocker la ressource sélectionnée
    let selectedDate = null; // Variable pour stocker la date sélectionnée

    // Initialisation du calendrier
    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        selectable: true,
        selectOverlap: false, // Empêche le chevauchement des sélections
        events: function (fetchInfo, successCallback, failureCallback) {
            fetch('/get_reservations/')
                .then(response => response.json())
                .then(events => {
                    successCallback(events.map(event => ({
                        ...event,
                        display: 'background', // Colore toute la cellule
                        backgroundColor: 'orange' // Assure la couleur de l'événement
                    })));
                })
                .catch(error => failureCallback(error));
        },
        dateClick: function (info) {
            // Vérifier si une journée est déjà réservée
            const events = calendar.getEvents();
            const isReserved = events.some(event =>
                event.startStr === info.dateStr
            );

            if (isReserved) {
                alert("Cette date est déjà réservée !");
                return; // Empêche la sélection
            }
            // Ouvrir la fenêtre modale et enregistrer la date sélectionnée
            selectedDate = info.dateStr;
            console.log("Date sélectionnée :", selectedDate);
            reservationModal.style.display = 'block';
            resetModalState(); // Réinitialiser l'état de la fenêtre modale
        },
        eventDidMount: function (info) {
            const template = document.getElementById('reservation-template');
            const clone = template.cloneNode(true); // Clone le modèle
            clone.style.display = ''; // Rendre le modèle visible
        
            // Ajoutez les données dynamiques
            clone.querySelector('.reservation-title').textContent = info.event.title;
            clone.querySelector('.reservation-resource').textContent = info.event.extendedProps.resource;
        
            // Ajoutez des écouteurs au bouton Annuler
            clone.querySelector('.cancel-btn').addEventListener('click', function () {
                if (confirm("Voulez-vous vraiment annuler cette réservation ?")) {
                    // Logic to cancel the event
                    info.event.remove(); // Supprime l'événement visuellement
                    fetch(`/delete_reservation/${info.event.id}/`, { method: 'DELETE' })
                        .then(response => response.json())
                        .then(data => alert(data.message))
                        .catch(error => console.error('Erreur lors de l\'annulation :', error));
                        
                }
            });
        
            // Ajoutez le modèle cloné à l'élément de l'événement
            info.el.innerHTML = ''; // Nettoyez le contenu existant
            info.el.appendChild(clone);
        }
    });

    calendar.render();

    // Gestion de la fermeture de la fenêtre modale
    document.querySelector('.close').addEventListener('click', function () {
        reservationModal.style.display = 'none';
        resetModalState(); // Réinitialiser l'état de la fenêtre modale
    });

    // Gestion de la sélection des ressources
    resourceButtons.forEach(button => {
        button.addEventListener('click', function () {
            // Retirer la classe "selected" de tous les boutons
            resourceButtons.forEach(btn => btn.classList.remove('selected'));
            // Ajouter la classe "selected" au bouton cliqué
            button.classList.add('selected');
            // Mettre à jour la ressource sélectionnée
            selectedResource = button.getAttribute('data-resource');
            console.log("Ressource sélectionnée :", selectedResource);
            toggleSubmitButton(true); // Activer le bouton de soumission
        });
    });

    // Gestion de la soumission du formulaire
    document.getElementById('reservationForm').addEventListener('submit', function (event) {
        event.preventDefault();

        // Envoi de la requête POST
        fetch('/create_reservation_ajax/', {
            method: 'POST',
            body: JSON.stringify({
                resource: selectedResource,
                date: selectedDate
            })
        })
            .then(response => response.json())
            .then(data => {
                if (data.message === 'Réservation réussie') {
                    alert(data.message);
                    calendar.refetchEvents(); // Rafraîchir le calendrier
                    reservationModal.style.display = 'none'; // Fermer la modale
                    resetModalState();
                } else {
                    alert('Erreur : ' + data.message);
                }
            })
            .catch(error => console.error('Erreur AJAX:', error));
    });

    // Fonction pour réinitialiser l'état de la fenêtre modale
    function resetModalState() {
        const resourceButtons = document.querySelectorAll('.resource-btn');
        resourceButtons.forEach(button => button.classList.remove('selected')); // Réinitialiser les boutons
        selectedResource = null; // Réinitialiser la ressource sélectionnée
        toggleSubmitButton(false); // Désactiver le bouton de soumission
    }

    // Fonction pour activer ou désactiver le bouton de soumission
    function toggleSubmitButton(enable) {
        if (submitButton) {
            submitButton.disabled = !enable;
        } 
    }
});
