document.addEventListener('DOMContentLoaded', function () {
    const calendarEl = document.getElementById('calendar');
    const reservationModal = document.getElementById('reservationModal');
    const resourceButtons = document.querySelectorAll('.resource-btn');
    const submitButton = document.getElementById('reservationSubmit');
    let selectedResource = null; // Variable pour stocker la ressource sélectionnée
    let selectedDate = null; // Variable pour stocker la date sélectionnée
    let isCancelling = false; // Variable pour suivre si une annulation est en cours

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

            // Vérifier si une annulation est en cours
            if (isCancelling) {
                isCancelling = false; // Réinitialise l'état après l'annulation
                return; // Empêche l'ouverture de la fenêtre modale
            }

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
                    isCancelling = true; // Active l'état d'annulation
                    // Récupérer l'ID avant de retirer l'événement
                    const eventId = info.event.id;
                    console.log("ID de la réservation à annuler:", eventId);  // Log de l'ID avant la suppression
                    // Supprimer l'événement visuellement
                    info.event.remove();
            
                    // Effectuer la requête DELETE en envoyant l'ID
                    fetch(`/delete_reservation/${eventId}/`, { 
                        method: 'DELETE',
                    })
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
            // Mettre à jour le champ "date" avec la date sélectionnée
            if (selectedDate) {
                document.getElementById('date').value = selectedDate;  // Met à jour le champ date
            }

            toggleSubmitButton(true); // Activer le bouton de soumission

            // Déclenche l'affichage des champs supplémentaires
            const modalContent = document.getElementById("modalContent");
            const extraFields = document.getElementById("extraFields");

            if (modalContent) {
                modalContent.classList.add("expanded");
            } else {
                console.error("modalContent est null. L'élément avec l'ID 'modalContent' est introuvable dans le DOM.");
            }

            modalContent.classList.add("expanded");
            extraFields.classList.remove("hidden");
        });
    });

    // Gestion de la soumission du formulaire
    document.getElementById('reservationForm').addEventListener('submit', function (event) {
        event.preventDefault(); // Empêcher la soumission par défaut du formulaire

        const data = {
            resource: document.getElementById('resource').value,
            date: document.getElementById('date').value,
            sample_name: document.getElementById('sample_name').value,
            materials: document.getElementById('materials').value,
            micro_meso_non_porous: document.getElementById('micro_meso_non_porous').value,
            estimated_surface_area: parseFloat(document.getElementById('estimated_surface_area').value),
            degassing_temperature: parseFloat(document.getElementById('degassing_temperature').value),
        };

        // Envoi de la requête POST pour créer la réservation
        fetch('/create_reservation_ajax/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(data => {
            if (data.message === 'Réservation réussie') {
                alert(data.message);
                calendar.refetchEvents(); // Rafraîchir les événements sur le calendrier
                reservationModal.style.display = 'none'; // Fermer la fenêtre modale
                resetModalState(); // Réinitialiser l'état de la fenêtre modale
            } else {
                alert('Erreur : ' + data.message);
            }
        })
        .catch(error => {
            console.error('Erreur lors de la création de la réservation :', error);
            alert("Une erreur est survenue lors de la réservation. Veuillez réessayer.");
        });
    });

    // Fonction pour réinitialiser l'état de la fenêtre modale
    function resetModalState() {
        resourceButtons.forEach(button => button.classList.remove('selected')); // Réinitialiser les boutons
        selectedResource = null; // Réinitialiser la ressource sélectionnée
        toggleSubmitButton(false); // Désactiver le bouton de soumission
    }

    // Fonction pour activer ou désactiver le bouton de soumission
    function toggleSubmitButton(enable) {
        const submitButton = document.getElementById('reservationSubmit');
        if (submitButton) {
            submitButton.disabled = !enable; // Activer ou désactiver le bouton
        } else {
            console.warn("Le bouton de soumission n'est pas disponible dans le DOM.");
        }
    }
});
