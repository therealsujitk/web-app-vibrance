var days = {};
var rooms = {};

/*
    Render a new version of the pro shows
 */
export function renderProShows(adminContent) {
    if (adminContent == null) {
        adminContent = document.getElementById('admin-content');
    }

    $.ajax({
        type: 'POST',
        url: '/pro_shows',
        error: function(error) {
            displayServerError();
        }
    }).then((response) => {
        adminContent.classList = "block-group";

        days = response["days"];
        rooms = response["rooms"];

        adminContent.innerHTML = `<div class="block clickable" onclick="openProShow();" title="Add Pro Show">
            <div style="margin-top: 60px; transform: translate(0%, -50%);">
                <i class="fas fa-plus fa-3x" style="margin: 0px 0px 5px 0px;"></i>
                <br>
                <span>Add Pro Show</span>
            </div>
        </div>`;

        var proShows = response["pro_shows"];

        for (var key in proShows) {
            var obj = proShows[key];
            var id = obj["id"];
            var dayID = obj["day_id"];
            var roomID = obj["room_id"];
            var dayString = obj["day_string"];
            var venue = obj["venue"];
            var description = obj["description"];
            var image = obj["image"];

            if (obj["room"] != null) {
                venue = venue + " - " + obj["room"];
            }

            adminContent.innerHTML += `<div class="block" style="background-image: url(${image});">
                <h2>${dayString}</h2>
                <span>${venue}</span>
                <i class="fas fa-pencil-alt block-button" style="right: 45px;" title="Edit Pro Show" onclick="openEditProShow(${id}, ${dayID}, ${roomID}, '${description}', '${image}');"></i>
                <i class="fas fa-times block-button" style="right: 20px;" title="Delete Pro Show" onclick="openDeleteProShow(${id}, '${dayString}')"></i>
            </div>`;
        }
    });
}

/*
    Change the contents of the modal to add a pro show
 */
window.openProShow = function() {
    var modal = document.getElementById('modal');
    
    let modalContent = `<table style="width: 100%;">
        <td><h3 class="modal-heading">Add Pro Show</h3></td>
        <td style="text-align: right;"><i class="fas fa-times modal-button" onclick="closeModal();"></i></td>
    </table>
    <select id="pro-show-day" class="text-box-primary">`;

    for (var key in days) {
        var day = days[key];
        modalContent = modalContent + `<option value="${day["id"]}">${day["day_string"]}</option>`;
    }
    
    modalContent = modalContent + `</select><select id="pro-show-room" class="text-box-primary">`;

    for (var key in rooms) {
        var room = rooms[key];
        var venue = room["venue"];

        if (room["room"] != null) {
            venue = venue + " - " + room["room"];
        }

        modalContent = modalContent + `<option value="${room["id"]}">${venue}</option>`;
    }
    
    modalContent = modalContent + `</select>`;

    modalContent = modalContent + `<textarea id="pro-show-description" class="text-box-primary" type="text" placeholder="Pro Show Description" autocomplete="off" spellcheck="true"></textarea>
    <input id="pro-show-image" class="text-box-primary" type="text" placeholder="Image URL" autocomplete="off" spellcheck="false" onkeyup="keyUp(event);"></input>
    <input class="btn-primary" type="button" style="margin-top: 10px;" value="Save Changes" title="Save Changes" onclick="addProShow(this);"></input>`;

    modal.innerHTML = modalContent;

    showModal();
}

/*
    Adding a pro show
 */
window.addProShow = function(saveButton) {
    toggleInput(saveButton);

    var dayID = document.getElementById('pro-show-day').value;
    var roomID = document.getElementById('pro-show-room').value;
    var description = document.getElementById('pro-show-description').value;
    var image = document.getElementById('pro-show-image').value;

    $.ajax({
        type: 'POST',
        data: {
            dayID: dayID,
            roomID: roomID,
            description: description,
            image: image
        },
        url: '/pro_shows/add',
        error: function(error) {
            displayServerError();
            toggleInput(saveButton);
        }
    }).then((response) => {
        if (response == 'success') {
            closeModal();
            displaySuccessfulAdd('pro show');
            renderProShows(null);
        } else {
            displayError(response);
            toggleInput(saveButton);
        }
    });
}

/*
    Change the contents of the modal to add a pro show
 */
window.openEditProShow = function(id, dayID, roomID, description, image) {
    var modal = document.getElementById('modal');
    
    let modalContent = `<table style="width: 100%;">
        <td><h3 class="modal-heading">Edit Pro Show</h3></td>
        <td style="text-align: right;"><i class="fas fa-times modal-button" onclick="closeModal();"></i></td>
    </table>
    <select id="pro-show-day" class="text-box-primary">`;

    for (var key in days) {
        var day = days[key];
        var selection = "";

        if (day["id"] == dayID) {
            selection = " selected";
        }

        modalContent = modalContent + `<option value="${day["id"]}"${selection}>${day["day_string"]}</option>`;
    }
    
    modalContent = modalContent + `</select><select id="pro-show-room" class="text-box-primary">`;

    for (var key in rooms) {
        var room = rooms[key];
        var venue = room["venue"];
        var selection = "";

        if (room["room"] != null) {
            venue = venue + " - " + room["room"];
        }

        if (room["id"] == roomID) {
            selection = " selected";
        }

        modalContent = modalContent + `<option value="${room["id"]}"${selection}>${venue}</option>`;
    }
    
    modalContent = modalContent + `</select>`;

    modalContent = modalContent + `<textarea id="pro-show-description" class="text-box-primary" type="text" placeholder="Pro Show Description" autocomplete="off" spellcheck="true">${description}</textarea>
    <input id="pro-show-image" class="text-box-primary" type="text" value="${image}" placeholder="Image URL" autocomplete="off" spellcheck="false" onkeyup="keyUp(event);"></input>
    <input class="btn-primary" type="button" style="margin-top: 10px;" value="Save Changes" title="Save Changes" onclick="editProShow(this, ${id});"></input>`;

    modal.innerHTML = modalContent;

    showModal();
}

/*
    Editing a pro show
 */
window.editProShow = function(saveButton, id) {
    toggleInput(saveButton);

    var dayID = document.getElementById('pro-show-day').value;
    var roomID = document.getElementById('pro-show-room').value;
    var description = document.getElementById('pro-show-description').value;
    var image = document.getElementById('pro-show-image').value;

    $.ajax({
        type: 'POST',
        data: {
            id: id,
            dayID: dayID,
            roomID: roomID,
            description: description,
            image: image
        },
        url: '/pro_shows/edit',
        error: function(error) {
            displayServerError();
            toggleInput(saveButton);
        }
    }).then((response) => {
        if (response == 'success') {
            closeModal();
            displaySuccessfulEdit('pro show');
            renderProShows(null);
        } else {
            displayError(response);
            toggleInput(saveButton);
        }
    });
}

/*
    Change the contents of the modal to delete a pro show
 */
window.openDeleteProShow = function(id, dayString) {
    var modal = document.getElementById('modal');
    
    modal.innerHTML = `<table style="width: 100%;">
        <td><h3 class="modal-heading">Delete Pro Show</h3></td>
        <td style="text-align: right;"><i class="fas fa-times modal-button" onclick="closeModal();"></i></td>
    </table>
    <p>Are you sure you want to delete the pro show for <b>${dayString}</b>? This action cannot be undone.</p>
    <input class="btn-primary" type="button" style="margin-top: 10px;" value="Yeah, I'm sure" title="Delete this pro show" onclick="deleteProShow(this, ${id});"></input>`;

    showModal();
}

/*
    Deleting a pro show
 */
window.deleteProShow = function(saveButton, id) {
    toggleInput(saveButton);

    $.ajax({
        type: 'POST',
        data: {
            id: id
        },
        url: '/pro_shows/delete',
        error: function(error) {
            displayServerError();
            toggleInput(saveButton);
        }
    }).then((response) => {
        if (response == 'success') {
            closeModal();
            displaySuccessfulDelete('pro show');
            renderProShows(null);
        } else {
            displayError(response);
            toggleInput(saveButton);
        }
    });
}
