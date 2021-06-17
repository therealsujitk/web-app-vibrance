var categories = {};
var days = {};
var rooms = {};

var timeout;

/*
    Closing all the categories
 */
function closeCategories() {
    var activeItems = document.getElementsByClassName('active');

    while (activeItems.length) {
        activeItems[0].classList.remove('active');
    }

    activeItems = document.getElementsByClassName('inner');

    for (var i = 0; i < activeItems.length; ++i) {
        var content = activeItems[i];

        clearTimeout(timeout);
        content.style.height = `${content.scrollHeight}px`;
        document.body.offsetLeft;
        content.style.height = 0;
    }
}

/*
    Viewing a category
 */
window.toggleCategory = function(id) {
    var heading = document.getElementById(`category-heading-${id}`);

    if (!heading.classList.contains('active')) {
        closeCategories();
    }

    heading.classList.toggle('active');
    document.getElementById(`category-button-${id}`).classList.toggle('active');
    
    var content = document.getElementById(`category-${id}`);

    if (content.style.height == '0px') {
        content.style.height = `${content.scrollHeight}px`;

        clearTimeout(timeout);
        timeout = setTimeout(function () {
            content.style.height = 'auto';
        }, 500);
    } else {
        clearTimeout(timeout);
        content.style.height = `${content.scrollHeight}px`;
        document.body.offsetLeft;
        content.style.height = 0;
    }
}

/*
    Clearing all selections
 */
function clearSelection() {
    var selectedDays = document.getElementsByClassName('btn-selection selected');

    while (selectedDays.length) {
        selectedDays[0].classList.remove('selected');
    }
}

/*
    Selecting a day
 */
window.selectDay = function(selectionButton, dayID) {
    clearSelection()
    selectionButton.classList.add('selected');
    renderEvents(0, dayID);
}

/*
    Render a new version of the events
 */
export function renderEvents(adminContent, dayID) {
    if (adminContent == null) {
        adminContent = document.getElementById('admin-content');
    }

    var url = '/events';

    if (dayID != null) {
        url = url + '/id/' + dayID;
    }

    $.ajax({
        type: 'POST',
        url: url,
        error: function(error) {
            displayServerError();
        }
    }).then((response) => {
        if (url == '/events') {
            adminContent.classList = "block-group";

            categories = response["categories"];
            days = response["days"];
            rooms = response["rooms"];

            for (var key in days) {
                var obj = days[key];
                var dayID = obj["id"];
                var day = obj["day_string"];
                var selection = "";

                if (key == 0) {
                    selection = " selected";
                }

                adminContent.innerHTML += `<input class="btn-selection${selection}" type="button" value="${day}" title="${day}" onclick="selectDay(this, ${dayID})"></input>`;
            }

            adminContent.innerHTML += `<div id="content"></div>`;
        }

        var dayID = 1;
    
        var content = document.getElementById('content');
        content.innerHTML = "";

        for (var key in categories) {
            var obj = categories[key];
            var categoryID = obj["id"];
            var category = obj["category"];

            if (key != 0) {
                content.innerHTML += `<hr>`;
            }

            content.innerHTML += `<h2 id="category-heading-${categoryID}" class="content-header clickable" onclick="toggleCategory(${categoryID})"><i id="category-button-${categoryID}" class="fas fa-angle-right"></i><span style="margin-left: 15px;">${category}</span></h2>
            <div id="category-${categoryID}" class="block-group inner" style="height: 0px;">
                <div class="block clickable" onclick="openEvent(${dayID}, ${categoryID});" title="Add Event">
                    <div style="margin-top: 60px; transform: translate(0%, -50%);">
                        <i class="fas fa-plus fa-3x" style="margin: 0px 0px 5px 0px;"></i>
                        <br>
                        <span>Add Event</span>
                    </div>
                </div>
            </div>`;
        }

        var events = response["events"];

        for (var key in events) {
            var obj = events[key];
            var id = obj["id"];
            var title = obj["title"]
            var categoryID = obj["category_id"];
            var dayID = obj["day_id"];
            var roomID = obj["room_id"];
            var venue = obj["venue"];
            var description = obj["description"];
            var image = obj["image"];
            var startTime = obj["start_time"];
            var endTime = obj["end_time"];
            var members = obj["members"];
            var entryFee = obj["entry_fee"];

            if (obj["room"] != null) {
                venue = venue + " - " + obj["room"];
            }

            var content = document.getElementById(`category-${categoryID}`);
            content.innerHTML += `<div class="block" style="background-image: url(${image});">
                <h2>${title}</h2>
                <span>${startTime} - ${endTime}</span><br>
                <span>${venue}</span><br>
                <span>&#8377;${entryFee}/-</span>
                <i class="fas fa-users block-button" style="left: 20px; cursor: default;" title="Members"><span class="event-members">${members}</span></i>
                <i class="fas fa-pencil-alt block-button" style="right: 45px;" title="Edit Event" onclick="openEditEvent(${id}, ${dayID}, '${title}', ${roomID}, '${description}', '${startTime}', '${endTime}', '${members}', ${entryFee}, '${image}');"></i>
                <i class="fas fa-times block-button" style="right: 20px;" title="Delete Event" onclick="openDeleteEvent(${id}, ${dayID}, '${title}')"></i>
            </div>`;
        }
    });
}

/*
    Change the contents of the modal to add an event
 */
window.openEvent = function(dayID, categoryID) {
    var modal = document.getElementById('modal');
    
    let modalContent = `<table style="width: 100%;">
        <td><h3 class="modal-heading">Add Event</h3></td>
        <td style="text-align: right;"><i class="fas fa-times modal-button" onclick="closeModal();"></i></td>
    </table>
    <input id="event-title" class="text-box-primary" type="text" placeholder="Event Title" autocomplete="off" spellcheck="false" onkeyup="keyUp(event);"></input>`;
    
    modalContent = modalContent + `<select id="event-room" class="text-box-primary">`;

    for (var key in rooms) {
        var room = rooms[key];
        var venue = room["venue"];

        if (room["room"] != null) {
            venue = venue + " - " + room["room"];
        }

        modalContent = modalContent + `<option value="${room["id"]}">${venue}</option>`;
    }
    
    modalContent = modalContent + `</select>`;

    modalContent = modalContent + `<textarea id="event-description" class="text-box-primary" type="text" placeholder="Event Description" autocomplete="off" spellcheck="true"></textarea>
    <table style="width: 100%;">
        <td style="padding-right: 5px;"><input id="event-start" class="text-box-primary" type="time" placeholder="Start Time" autocomplete="off" spellcheck="false" onkeyup="keyUp(event);"></input></td>
        <td style="padding-left: 5px;"><input id="event-end" class="text-box-primary" type="time" placeholder="End Time" autocomplete="off" spellcheck="false" onkeyup="keyUp(event);"></input></td>
    </table>
    <input id="event-members" class="text-box-primary" type="text" placeholder="Number of members" autocomplete="off" spellcheck="false" onkeyup="keyUp(event);"></input>
    <input id="event-fee" class="text-box-primary" type="number" placeholder="Entry Fee" autocomplete="off" spellcheck="false" onkeyup="keyUp(event);"></input>
    <input id="event-image" class="text-box-primary" type="text" placeholder="Image URL" autocomplete="off" spellcheck="false" onkeyup="keyUp(event);"></input>
    <input class="btn-primary" type="button" style="margin-top: 10px;" value="Save Changes" title="Save Changes" onclick="addEvent(this, ${dayID}, ${categoryID});"></input>`;

    modal.innerHTML = modalContent;

    showModal();
}

/*
    Adding an event
 */
window.addEvent = function(saveButton, dayID, categoryID) {
    toggleInput(saveButton);

    var title = document.getElementById('event-title').value;
    var roomID = document.getElementById('event-room').value;
    var description = document.getElementById('event-description').value;
    var startTime = document.getElementById('event-start').value;
    var endTime = document.getElementById('event-end').value;
    var members = document.getElementById('event-members').value;
    var entryFee = document.getElementById('event-fee').value;
    var image = document.getElementById('event-image').value;

    $.ajax({
        type: 'POST',
        data: {
            title: title,
            description: description,
            image: image,
            categoryID: categoryID,
            dayID: dayID,
            roomID: roomID,
            startTime: startTime,
            endTime: endTime,
            members: members,
            entryFee: entryFee
        },
        url: '/events/add',
        error: function(error) {
            displayServerError();
            toggleInput(saveButton);
        }
    }).then((response) => {
        if (response == 'success') {
            closeModal();
            displaySuccessfulAdd('event');
            renderEvents(0, dayID);
        } else {
            displayError(response);
            toggleInput(saveButton);
        }
    });
}

/*
    Change the contents of the modal to edit an event
 */
window.openEditEvent = function(id, dayID, title, roomID, description, startTime, endTime, members, entryFee, image) {
    var modal = document.getElementById('modal');
    
    let modalContent = `<table style="width: 100%;">
        <td><h3 class="modal-heading">Edit Event</h3></td>
        <td style="text-align: right;"><i class="fas fa-times modal-button" onclick="closeModal();"></i></td>
    </table>
    <input id="event-title" class="text-box-primary" type="text"  value="${title}"placeholder="Event Title" autocomplete="off" spellcheck="false" onkeyup="keyUp(event);"></input>`;
    
    modalContent = modalContent + `<select id="event-room" class="text-box-primary">`;

    for (var key in rooms) {
        var room = rooms[key];
        var venue = room["venue"];
        var selected = "";

        if (room["room"] != null) {
            venue = venue + " - " + room["room"];
        }

        if (roomID == room["id"]) {
            selected = " selected";
        }

        modalContent = modalContent + `<option value="${room["id"]}"${selected}>${venue}</option>`;
    }
    
    modalContent = modalContent + `</select>`;

    modalContent = modalContent + `<textarea id="event-description" class="text-box-primary" type="text" placeholder="Event Description" autocomplete="off" spellcheck="true">${description}</textarea>
    <table style="width: 100%;">
        <td style="padding-right: 5px;"><input id="event-start" class="text-box-primary" type="time" value="${startTime}" placeholder="Start Time" autocomplete="off" spellcheck="false" onkeyup="keyUp(event);"></input></td>
        <td style="padding-left: 5px;"><input id="event-end" class="text-box-primary" type="time" value="${endTime}" placeholder="End Time" autocomplete="off" spellcheck="false" onkeyup="keyUp(event);"></input></td>
    </table>
    <input id="event-members" class="text-box-primary" type="text" value="${members}" placeholder="Number of members" autocomplete="off" spellcheck="false" onkeyup="keyUp(event);"></input>
    <input id="event-fee" class="text-box-primary" type="number" value="${entryFee}" placeholder="Entry Fee" autocomplete="off" spellcheck="false" onkeyup="keyUp(event);"></input>
    <input id="event-image" class="text-box-primary" type="text" value="${image}" placeholder="Image URL" autocomplete="off" spellcheck="false" onkeyup="keyUp(event);"></input>
    <input class="btn-primary" type="button" style="margin-top: 10px;" value="Save Changes" title="Save Changes" onclick="editEvent(this, ${id}, ${dayID});"></input>`;

    modal.innerHTML = modalContent;

    showModal();
}

/*
    Adding an event
 */
window.editEvent = function(saveButton, id, dayID) {
    toggleInput(saveButton);

    var title = document.getElementById('event-title').value;
    var roomID = document.getElementById('event-room').value;
    var description = document.getElementById('event-description').value;
    var startTime = document.getElementById('event-start').value;
    var endTime = document.getElementById('event-end').value;
    var members = document.getElementById('event-members').value;
    var entryFee = document.getElementById('event-fee').value;
    var image = document.getElementById('event-image').value;

    $.ajax({
        type: 'POST',
        data: {
            id: id,
            title: title,
            description: description,
            image: image,
            roomID: roomID,
            startTime: startTime,
            endTime: endTime,
            members: members,
            entryFee: entryFee
        },
        url: '/events/edit',
        error: function(error) {
            displayServerError();
            toggleInput(saveButton);
        }
    }).then((response) => {
        if (response == 'success') {
            closeModal();
            displaySuccessfulEdit('event');
            renderEvents(0, dayID);
        } else {
            displayError(response);
            toggleInput(saveButton);
        }
    });
}

/*
    Change the contents of the modal to delete an event
 */
window.openDeleteEvent = function(id, dayID, title) {
    var modal = document.getElementById('modal');
    
    modal.innerHTML = `<table style="width: 100%;">
        <td><h3 class="modal-heading">Delete Event</h3></td>
        <td style="text-align: right;"><i class="fas fa-times modal-button" onclick="closeModal();"></i></td>
    </table>
    <p>Are you sure you want to delete <b>${title}</b>? This action cannot be undone.</p>
    <input class="btn-primary" type="button" style="margin-top: 10px;" value="Yeah, I'm sure" title="Delete this event" onclick="deleteEvent(this, ${id}, ${dayID});"></input>`;

    showModal();
}

/*
    Deleting an event
 */
window.deleteEvent = function(saveButton, id, dayID) {
    toggleInput(saveButton);

    $.ajax({
        type: 'POST',
        data: {
            id: id
        },
        url: '/events/delete',
        error: function(error) {
            displayServerError();
            toggleInput(saveButton);
        }
    }).then((response) => {
        if (response == 'success') {
            closeModal();
            displaySuccessfulDelete('event');
            renderEvents(0, dayID);
        } else {
            displayError(response);
            toggleInput(saveButton);
        }
    });
}
