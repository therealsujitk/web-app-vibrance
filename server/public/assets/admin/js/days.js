/*
    Render a new version of the days
 */
export function renderDays(adminContent) {
    if (adminContent == null) {
        adminContent = document.getElementById('admin-content');
    }

    var months = [
        "January",
        "Feburary",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "Novomber",
        "December"
    ];

    $.ajax({
        type: 'POST',
        url: '/days',
        error: function(error) {
            displayServerError();
        }
    }).then((response) => {
        adminContent.classList = "block-group";
        adminContent.innerHTML = `<div class="block clickable" onclick="openDay();" title="Add Day">
            <div style="margin-top: 60px; transform: translate(0%, -50%);">
                <i class="fas fa-plus fa-3x" style="margin: 0px 0px 5px 0px;"></i>
                <br>
                <span>Add Day</span>
            </div>
        </div>`;

        for (var key in response) {
            var obj = response[key];
            var id = obj["id"];
            var dayString = obj["day_string"];
            var date = new Date(obj["date_string"]);

            var dateString = date.getUTCDate() + "-" + months[date.getUTCMonth()] + "-" + date.getUTCFullYear();

            var monthDate = date.getUTCMonth() + 1;
            var dateDate = date.getUTCDate();

            if (monthDate < 10) {
                monthDate = "0" + monthDate;
            }

            if (dateDate < 10) {
                dateDate = "0" + dateDate;
            }

            var shortDateString = date.getUTCFullYear() + "-" + monthDate + "-" + dateDate;

            adminContent.innerHTML += `<div class="block" style="background-image: url(../assets/admin/images/background-day.svg); background-blend-mode: color-dodge;">
                <h2>` + dayString + `</h2>
                <span>` + dateString + `</span>
                <i class="fas fa-pencil-alt block-button" style="right: 45px;" title="Edit Day" onclick="openEditDay(${id}, '${dayString}', '${shortDateString}');"></i>
                <i class="fas fa-times block-button" style="right: 20px;" title="Delete Day" onclick="openDeleteDay(${id}, '${dayString}')"></i>
            </div>`;
        }
    });
}

/*
    Change the contents of the modal to add a day
 */
window.openDay = function() {
    var modal = document.getElementById('modal');
    
    modal.innerHTML = `<table style="width: 100%;">
        <td><h3 class="modal-heading">Add Day</h3></td>
        <td style="text-align: right;"><i class="fas fa-times modal-button" onclick="closeModal();"></i></td>
    </table>
    <input id="day" class="text-box-primary" type="text" placeholder="Day Title" autocomplete="off" spellcheck="false" onkeyup="keyUp(event);"></input>
    <input id="date" class="text-box-primary" type="date" placeholder="Date" autocomplete="off" spellcheck="false" onkeyup="keyUp(event);"></input>
    <input class="btn-primary" type="button" style="margin-top: 10px;" value="Save Changes" title="Save Changes" onclick="addDay(this);"></input>`;

    showModal();
}

/*
    Adding a day
 */
window.addDay = function(saveButton) {
    toggleInput(saveButton);

    var dayString = document.getElementById('day').value;
    var dateString = document.getElementById('date').value;

    $.ajax({
        type: 'POST',
        data: {
            dayString: dayString,
            dateString: dateString
        },
        url: '/days/add',
        error: function(error) {
            displayServerError();
            toggleInput(saveButton);
        }
    }).then((response) => {
        if (response == 'success') {
            closeModal();
            displaySuccessfulAdd('day');
            renderDays(null);
        } else {
            displayError(response);
            toggleInput(saveButton);
        }
    });
}

/*
    Change the contents of the modal to edit a day
 */
window.openEditDay = function(id, dayString, dateString) {
    var modal = document.getElementById('modal');
    
    modal.innerHTML = `<table style="width: 100%;">
        <td><h3 class="modal-heading">Edit Day</h3></td>
        <td style="text-align: right;"><i class="fas fa-times modal-button" onclick="closeModal();"></i></td>
    </table>
    <input id="day" class="text-box-primary" type="text" placeholder="Day Title" value="${dayString}" autocomplete="off" spellcheck="false" onkeyup="keyUp(event);"></input>
    <input id="date" class="text-box-primary" type="date" placeholder="Date" value="${dateString}" autocomplete="off" spellcheck="false" onkeyup="keyUp(event);"></input>
    <input class="btn-primary" type="button" style="margin-top: 10px;" value="Save Changes" title="Save Changes" onclick="editDay(this, ${id});"></input>`;

    showModal();
}

/*
    Editing a day
 */
window.editDay = function(saveButton, id) {
    toggleInput(saveButton);

    var dayString = document.getElementById('day').value;
    var dateString = document.getElementById('date').value;

    $.ajax({
        type: 'POST',
        data: {
            id: id,
            dayString: dayString,
            dateString: dateString
        },
        url: '/days/edit',
        error: function(error) {
            displayServerError();
            toggleInput(saveButton);
        }
    }).then((response) => {
        if (response == 'success') {
            closeModal();
            displaySuccessfulEdit('day');
            renderDays(null);
        } else {
            displayError(response);
            toggleInput(saveButton);
        }
    });
}

/*
    Change the contents of the modal to delete a day
 */
window.openDeleteDay = function(id, dayString) {
    var modal = document.getElementById('modal');
    
    modal.innerHTML = `<table style="width: 100%;">
        <td><h3 class="modal-heading">Delete Day</h3></td>
        <td style="text-align: right;"><i class="fas fa-times modal-button" onclick="closeModal();"></i></td>
    </table>
    <p>Are you sure you want to delete <b>${dayString}</b>? This action cannot be undone.</p>
    <input class="btn-primary" type="button" style="margin-top: 10px;" value="Yeah, I'm sure" title="Delete this day" onclick="deleteDay(this, ${id});"></input>`;

    showModal();
}

/*
    Deleting a day
 */
window.deleteDay = function(saveButton, id) {
    toggleInput(saveButton);

    $.ajax({
        type: 'POST',
        data: {
            id: id
        },
        url: '/days/delete',
        error: function(error) {
            displayServerError();
            toggleInput(saveButton);
        }
    }).then((response) => {
        if (response == 'success') {
            closeModal();
            displaySuccessfulDelete('day');
            renderDays(null);
        } else {
            displayError(response);
            toggleInput(saveButton);
        }
    });
}
