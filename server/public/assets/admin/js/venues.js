/*
    Render a new version of the venues
 */
export function renderVenues(adminContent) {
    if (adminContent == null) {
        adminContent = document.getElementById('admin-content');
    }

    $.ajax({
        type: 'POST',
        url: '/venues',
        error: function(error) {
            displayServerError();
        }
    }).then((response) => {
        adminContent.classList = "block-group";
        adminContent.innerHTML = `<div class="block clickable" onclick="openVenue();" title="Add Venue">
            <div style="margin-top: 60px; transform: translate(0%, -50%);">
                <i class="fas fa-plus fa-3x" style="margin: 0px 0px 5px 0px;"></i>
                </br>
                <span>Add Venue</span>
            </div>
        </div>`;

        var venues = response["venues"];
        var rooms = response["rooms"];

        var venueTitles = {};

        for (var key in venues) {
            var obj = venues[key];
            var id = obj["id"];
            var venue = obj["venue"];

            adminContent.innerHTML += `<div class="block" style="background-image: url(../assets/admin/images/background-venue.svg); background-blend-mode: color-dodge;">
                <h2>${venue}</h2>
                <div id="venue-${id}">
                    <i class="fas fa-plus tag button" title="Add Room" onclick="openRoom(${id}, '${venue}');"></i>
                </div>
                <i class="fas fa-pencil-alt block-button" style="right: 45px;" title="Edit Venue" onclick="openEditVenue(${id}, '${venue}');"></i>
                <i class="fas fa-times block-button" style="right: 20px;" title="Delete Venue" onclick="openDeleteVenue(${id}, '${venue}');"></i>
            </div>`;

            venueTitles[id] = venue;
        }

        for (var key in rooms) {
            var obj = rooms[key];
            var id = obj["id"];
            var room = obj["room"];
            var venueID = obj["venue_id"];

            if (room == null) {
                continue;
            }

            var venue = document.getElementById(`venue-${venueID}`);
            venue.innerHTML = venue.innerHTML + `<span class="tag" title="Click to delete" onclick="openDeleteRoom(${id}, '${venueTitles[venueID]}', '${room}');">${room}</span>`;
        }
    });
}

/*
    Change the contents of the modal to add a venue
 */
window.openVenue = function() {
    var modal = document.getElementById('modal');
    
    modal.innerHTML = `<table style="width: 100%;">
        <td><h3 class="modal-heading">Add Venue</h3></td>
        <td style="text-align: right;"><i class="fas fa-times modal-button" onclick="closeModal();"></i></td>
    </table>
    <input id="venue" class="text-box-primary" type="text" placeholder="Venue Title" autocomplete="off" spellcheck="false" onkeyup="keyUp(event);"></input>
    <input class="btn-primary" type="button" style="margin-top: 10px;" value="Save Changes" title="Save Changes" onclick="addVenue(this);"></input>`;

    showModal();
}

/*
    Adding a venue
 */
window.addVenue = function(saveButton) {
    toggleInput(saveButton);

    var venue = document.getElementById('venue').value;

    if (venue.trim() == "") {
        displayError('Sorry, the venue\'s title cannot be blank.');
        toggleInput(saveButton);
        return;
    }

    $.ajax({
        type: 'POST',
        data: {
            venue: venue
        },
        url: '/venues/add',
        error: function(error) {
            displayServerError();
            toggleInput(saveButton);
        }
    }).then((response) => {
        if (response == 'success') {
            closeModal();
            displaySuccessfulAdd('venue');
            renderVenues(null);
        } else {
            displayError(response);
            toggleInput(saveButton);
        }
    });
}

/*
    Change the contents of the modal to edit a venue
 */
window.openEditVenue = function(id, venue) {
    var modal = document.getElementById('modal');
    
    modal.innerHTML = `<table style="width: 100%;">
        <td><h3 class="modal-heading">Edit Venue</h3></td>
        <td style="text-align: right;"><i class="fas fa-times modal-button" onclick="closeModal();"></i></td>
    </table>
    <input id="venue" class="text-box-primary" type="text" value="${venue}" placeholder="Venue Title" autocomplete="off" spellcheck="false" onkeyup="keyUp(event);"></input>
    <input class="btn-primary" type="button" style="margin-top: 10px;" value="Save Changes" title="Save Changes" onclick="editVenue(this, ${id});"></input>`;

    showModal();
}

/*
    Editing a venue
 */
window.editVenue = function(saveButton, id) {
    toggleInput(saveButton);

    var venue = document.getElementById('venue').value;

    if (venue.trim() == "") {
        displayError('Sorry, the venue\'s title cannot be blank.');
        toggleInput(saveButton);
        return;
    }

    $.ajax({
        type: 'POST',
        data: {
            id: id,
            venue: venue
        },
        url: '/venues/edit',
        error: function(error) {
            displayServerError();
            toggleInput(saveButton);
        }
    }).then((response) => {
        if (response == 'success') {
            closeModal();
            displaySuccessfulEdit('venue');
            renderVenues(null);
        } else {
            displayError(response);
            toggleInput(saveButton);
        }
    });
}

/*
    Change the contents of the modal to delete a venue
 */
window.openDeleteVenue = function(id, venue) {
    var modal = document.getElementById('modal');
    
    modal.innerHTML = `<table style="width: 100%;">
        <td><h3 class="modal-heading">Delete Venue</h3></td>
        <td style="text-align: right;"><i class="fas fa-times modal-button" onclick="closeModal();"></i></td>
    </table>
    <p>Are you sure you want to delete <b>${venue}</b>? This action cannot be undone.</p>
    <input class="btn-primary" type="button" style="margin-top: 10px;" value="Yeah, I'm sure" title="Delete this venue" onclick="deleteVenue(this, ${id});"></input>`;

    showModal();
}

/*
    Deleting a venue
 */
window.deleteVenue = function(saveButton, id) {
    toggleInput(saveButton);

    $.ajax({
        type: 'POST',
        data: {
            id: id
        },
        url: '/venues/delete',
        error: function(error) {
            displayServerError();
            toggleInput(saveButton);
        }
    }).then((response) => {
        if (response == 'success') {
            closeModal();
            displaySuccessfulDelete('venue');
            renderVenues(null);
        } else {
            displayError(response);
            toggleInput(saveButton);
        }
    });
}

/*
    Change the contents of the modal to add a venue
 */
window.openRoom = function(id, venue) {
    var modal = document.getElementById('modal');
    
    modal.innerHTML = `<table style="width: 100%;">
        <td><h3 class="modal-heading">Add Room</h3></td>
        <td style="text-align: right;"><i class="fas fa-times modal-button" onclick="closeModal();"></i></td>
    </table>
    <p>This room will be added to <b>${venue}</b>.</p>
    <input id="room" class="text-box-primary" type="text" placeholder="Room Title" autocomplete="off" spellcheck="false" onkeyup="keyUp(event);"></input>
    <input class="btn-primary" type="button" style="margin-top: 10px;" value="Save Changes" title="Save Changes" onclick="addRoom(this, ${id});"></input>`;

    showModal();
}

/*
    Adding a room
 */
window.addRoom = function(saveButton, venueID) {
    toggleInput(saveButton);

    var room = document.getElementById('room').value;

    if (room.trim() == "") {
        displayError('Sorry, the room\'s title cannot be blank.');
        toggleInput(saveButton);
        return;
    }

    $.ajax({
        type: 'POST',
        data: {
            venueID, venueID,
            room: room
        },
        url: '/venues/rooms/add',
        error: function(error) {
            displayServerError();
            toggleInput(saveButton);
        }
    }).then((response) => {
        if (response == 'success') {
            closeModal();
            displaySuccessfulAdd('room');
            renderVenues(null);
        } else {
            displayError(response);
            toggleInput(saveButton);
        }
    });
}

/*
    Change the contents of the modal to delete a venue
 */
window.openDeleteRoom = function(id, venue, room) {
    var modal = document.getElementById('modal');
    
    modal.innerHTML = `<table style="width: 100%;">
        <td><h3 class="modal-heading">Delete Room</h3></td>
        <td style="text-align: right;"><i class="fas fa-times modal-button" onclick="closeModal();"></i></td>
    </table>
    <p>Are you sure you want to delete <b>${room}</b> from <b>${venue}</b>? This action cannot be undone.</p>
    <input class="btn-primary" type="button" style="margin-top: 10px;" value="Yeah, I'm sure" title="Delete this room" onclick="deleteRoom(this, ${id});"></input>`;

    showModal();
}

/*
    Deleting a venue
 */
window.deleteRoom = function(saveButton, id) {
    toggleInput(saveButton);

    $.ajax({
        type: 'POST',
        data: {
            id: id
        },
        url: '/venues/rooms/delete',
        error: function(error) {
            displayServerError();
            toggleInput(saveButton);
        }
    }).then((response) => {
        if (response == 'success') {
            closeModal();
            displaySuccessfulDelete('room');
            renderVenues(null);
        } else {
            displayError(response);
            toggleInput(saveButton);
        }
    });
}
