/*
    Render a new version of the merchandise
 */
export function renderMerchandise(adminContent) {
    if (adminContent == null) {
        adminContent = document.getElementById('admin-content');
    }

    $.ajax({
        type: 'POST',
        url: '/merchandise',
        error: function(error) {
            displayServerError();
        }
    }).then((response) => {
        adminContent.classList = "block-group";
        adminContent.innerHTML = `<div class="block clickable" onclick="openMerchandise();" title="Add Merchandise">
            <div style="margin-top: 60px; transform: translate(0%, -50%);">
                <i class="fas fa-plus fa-3x" style="margin: 0px 0px 5px 0px;"></i>
                </br>
                <span>Add Merchandise</span>
            </div>
        </div>`;

        for (var key in response) {
            var obj = response[key];
            var id = obj["id"];
            var title = obj["title"];
            var image = obj["image"];
            var cost = obj["cost"];

            adminContent.innerHTML += `<div class="block" style="background-image: url(${image});">
                <h2>${title}</h2>
                <span>&#8377;${cost}/-</span>
                <i class="fas fa-pencil-alt block-button" style="right: 45px;" title="Edit Merchandise" onclick="openEditMerchandise(${id}, '${title}', ${cost}, '${image}');"></i>
                <i class="fas fa-times block-button" style="right: 20px;" title="Delete Merchandise" onclick="openDeleteMerchandise(${id}, '${title}');"></i>
            </div>`;
        }
    });
}

/*
    Change the contents of the modal to edit a day
 */
window.openMerchandise = function() {
    var modal = document.getElementById('modal');
    
    modal.innerHTML = `<table style="width: 100%;">
        <td><h3 class="modal-heading">Add Merchandise</h3></td>
        <td style="text-align: right;"><i class="fas fa-times modal-button" onclick="closeModal();"></i></td>
    </table>
    <input id="title" class="text-box-primary" type="text" placeholder="Merchandise Title" autocomplete="off" spellcheck="false" onkeyup="keyUp(event);"></input>
    <input id="cost" class="text-box-primary" type="number" placeholder="Cost" autocomplete="off" spellcheck="false" onkeyup="keyUp(event);"></input>
    <input id="merch-image" class="text-box-primary" type="text" placeholder="Image URL" autocomplete="off" spellcheck="false" onkeyup="keyUp(event);"></input>
    <input class="btn-primary" type="button" style="margin-top: 10px;" value="Save Changes" title="Save Changes" onclick="addMerchandise(this);"></input>`;

    showModal();
}

/*
    Editing merchandise
 */
window.addMerchandise = function(saveButton) {
    toggleInput(saveButton);

    var title = document.getElementById('title').value;
    var cost = document.getElementById('cost').value;
    var image = document.getElementById('merch-image').value;

    $.ajax({
        type: 'POST',
        data: {
            title: title,
            cost: cost,
            image: image
        },
        url: '/merchandise/add',
        error: function(error) {
            displayServerError();
            toggleInput(saveButton);
        }
    }).then((response) => {
        if (response == 'success') {
            closeModal();
            displaySuccessfulAdd('merchandise');
            renderMerchandise(null);
        } else {
            displayError(response);
            toggleInput(saveButton);
        }
    });
}

/*
    Change the contents of the modal to edit a day
 */
window.openEditMerchandise = function(id, title, cost, image) {
    var modal = document.getElementById('modal');
    
    modal.innerHTML = `<table style="width: 100%;">
        <td><h3 class="modal-heading">Edit Merchandise</h3></td>
        <td style="text-align: right;"><i class="fas fa-times modal-button" onclick="closeModal();"></i></td>
    </table>
    <input id="title" class="text-box-primary" type="text" placeholder="Merchandise Title" value="${title}" autocomplete="off" spellcheck="false" onkeyup="keyUp(event);"></input>
    <input id="cost" class="text-box-primary" type="number" placeholder="cost" value="${cost}" autocomplete="off" spellcheck="false" onkeyup="keyUp(event);"></input>
    <input id="merch-image" class="text-box-primary" type="text" placeholder="Image URL" value="${image}" autocomplete="off" spellcheck="false" onkeyup="keyUp(event);"></input>
    <input class="btn-primary" type="button" style="margin-top: 10px;" value="Save Changes" title="Save Changes" onclick="editMerchandise(this, ${id});"></input>`;

    showModal();
}

/*
    Editing merchandise
 */
window.editMerchandise = function(saveButton, id) {
    toggleInput(saveButton);

    var title = document.getElementById('title').value;
    var cost = document.getElementById('cost').value;
    var image = document.getElementById('merch-image').value;

    $.ajax({
        type: 'POST',
        data: {
            id: id,
            title: title,
            cost: cost,
            image: image
        },
        url: '/merchandise/edit',
        error: function(error) {
            displayServerError();
            toggleInput(saveButton);
        }
    }).then((response) => {
        if (response == 'success') {
            closeModal();
            displaySuccessfulEdit('merchandise');
            renderMerchandise(null);
        } else {
            displayError(response);
            toggleInput(saveButton);
        }
    });
}

/*
    Change the contents of the modal to delete merchandise
 */
window.openDeleteMerchandise = function(id, title) {
    var modal = document.getElementById('modal');
    
    modal.innerHTML = `<table style="width: 100%;">
        <td><h3 class="modal-heading">Delete Merchandise</h3></td>
        <td style="text-align: right;"><i class="fas fa-times modal-button" onclick="closeModal();"></i></td>
    </table>
    <p>Are you sure you want to delete <b>${title}</b>? This action cannot be undone.</p>
    <input class="btn-primary" type="button" style="margin-top: 10px;" value="Yeah, I'm sure" title="Delete this merchandise" onclick="deleteMerchandise(this, ${id});"></input>`;

    showModal();
}

/*
    Deleting merchandise
 */
window.deleteMerchandise = function(saveButton, id) {
    toggleInput(saveButton);

    $.ajax({
        type: 'POST',
        data: {
            id: id
        },
        url: '/merchandise/delete',
        error: function(error) {
            displayServerError();
            toggleInput(saveButton);
        }
    }).then((response) => {
        if (response == 'success') {
            closeModal();
            displaySuccessfulDelete('merchandise');
            renderMerchandise(null);
        } else {
            displayError(response);
            toggleInput(saveButton);
        }
    });
}
