document.addEventListener('DOMContentLoaded', function() {
    // Définir la fonction openCalendar
    function openCalendar() {
        var calendarWindow = window.open('/calendar/', 'Calendrier', 'width=800,height=600');
        calendarWindow.focus();
    }

    // Récupérer le bouton avec l'ID 'open-calendar-button'
    const openCalendarButton = document.getElementById('open-calendar-button');

    // Ajouter l'événement seulement si l'élément est trouvé
    if (openCalendarButton) {
        openCalendarButton.addEventListener('click', openCalendar);
    }
});
