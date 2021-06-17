import * as Settings from './settings.js';
import * as Users from './users.js';
import * as Days from './days.js';
import * as Categories from './categories.js';
import * as Venues from './venues.js';
import * as Events from './events.js';
import * as ProShows from './pro_shows.js';
import * as Merchandise from './merchandise.js';
import * as Social from './social.js';

/*
    Setting up the page once it's loaded
 */
window.setUp = function() {
    Settings.renderSettings(null);
}

/*
    Removing the highlight from the old selection
 */
function clearSelection() {
    var tabs = document.getElementsByClassName('selected');

    while (tabs.length) {
        tabs[0].classList.remove('selected');
    }
}

/*
    Render a new version of the admin page
 */
window.switchTab = function(tab) {
    var title = tab.innerText;

    clearSelection();
    tab.classList.add('selected')

    document.getElementById('admin-title').innerHTML = tab.innerHTML;
    var adminDescription = document.getElementById('admin-description');
    var adminContent = document.getElementById('admin-content');

    adminContent.innerHTML = '';
    
    if (title.toLowerCase().includes('settings')) {
        adminDescription.innerText = 'General site settings.';
        Settings.renderSettings(adminContent);
    } else if (title.toLowerCase().includes('activity')) {
        adminDescription.innerText = 'Log history.';
    } else if (title.toLowerCase().includes('users')) {
        adminDescription.innerText = 'Add, edit or remove users.';
        Users.renderUsers(adminContent);
    } else if (title.toLowerCase().includes('days')) {
        adminDescription.innerText = 'Add, edit or remove days.';
        Days.renderDays(adminContent);
    } else if (title.toLowerCase().includes('categories')) {
        adminDescription.innerText = 'Add, edit or remove event categories.';
        Categories.renderCategories(adminContent);
    } else if (title.toLowerCase().includes('venues')) {
        adminDescription.innerText = 'Add, edit or remove venues.';
        Venues.renderVenues(adminContent);
    } else if (title.toLowerCase().includes('events')) {
        adminDescription.innerText = 'Add, edit or remove events.';
        Events.renderEvents(adminContent, null);
    } else if (title.toLowerCase().includes('shows')) {
        adminDescription.innerText = 'Add, edit or remove pro shows.';
        ProShows.renderProShows(adminContent);
    } else if (title.toLowerCase().includes('merchandise')) {
        adminDescription.innerText = 'Add, edit or remove merchandise.';
        Merchandise.renderMerchandise(adminContent);
    } else if (title.toLowerCase().includes('social')) {
        adminDescription.innerText = 'Edit social media links.';
        Social.renderSocial(adminContent);
    } else if (title.toLowerCase().includes('team')) {
        adminDescription.innerText = 'Add, edit or remove team members.';
    }
}

/*
    Setting the input to loading when clicked
 */
var inputs = {};

window.toggleInput = function(input) {
    if (input.disabled === false) {
        inputs[input] = input.value;
        input.disabled = true;
        input.value = 'Please wait...';
    } else {
        input.value = inputs[input];
        input.disabled = false;
        delete inputs[input];
    }
}

/*
    Opening the modal
 */
window.showModal = function() {
    var modal = document.getElementById('modal');
    var modalBackground = document.getElementById('modal-background');

    modalBackground.style.top = "0";
    modal.style.top = "0";

    modal.classList.add('show');
    modalBackground.classList.add('show');
}

/*
    Closing the modal
 */
window.closeModal = function() {
    var modal = document.getElementById('modal');
    var modalBackground = document.getElementById('modal-background');

    setTimeout(function() {
        modalBackground.style.top = "-100%";
        modal.style.top = "-100%";
    }, 300);

    modal.classList.remove('show');
    modalBackground.classList.remove('show');
}

/*
    Displaying a successful addition
 */
window.displaySuccessfulAdd = function(data) {
    displaySuccess('Your ' + data + ' has been added.');
}

/*
    Displaying a successful edit
 */
window.displaySuccessfulEdit = function(data) {
    displaySuccess('Your ' + data + ' has been edited.');
}

/*
    Displaying a successful delete
 */
window.displaySuccessfulDelete = function(data) {
    displaySuccess('Your ' + data + ' has been deleted.');
}

/*
    Displaying a success message
 */
window.displaySuccess = function(message) {
    var alert = document.getElementById('alert');
    var timeout = 0;

    if(alert.classList.contains('show')) {
        alert.classList.remove('show');
        timeout = 300;
    }

    setTimeout(function() {
        document.getElementById('alert-content').innerText = message;
        alert.classList.remove('error');
        alert.classList.add('show');
    }, timeout)
}

/*
    Displaying a server error
 */
window.displayServerError = function() {
    displayError("Sorry, there was a problem connecting to the server.");
}

/*
    Displaying an error message
 */
window.displayError = function(message) {
    var alert = document.getElementById('alert');
    var timeout = 0;

    if(alert.classList.contains('show')) {
        alert.classList.remove('show');
        timeout = 300;
    }

    setTimeout(function() {
        document.getElementById('alert-content').innerText = message;
        alert.classList.add('error');
        alert.classList.add('show');
    }, timeout)
}

/*
    Hiding the alert message
 */
window.hideAlert = function() {
    document.getElementById('alert').classList.remove('show');
}
