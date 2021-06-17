/*
    Render a new version of the social links
 */
export function renderSocial(adminContent) {
    if (adminContent == null) {
        adminContent = document.getElementById('admin-content');
    }

    $.ajax({
        type: 'POST',
        url: '/social',
        error: function(error) {
            displayServerError();
        }
    }).then((response) => {
        adminContent.classList = "block-group";
        adminContent.innerHTML = "";

        for (var key in response) {
            var obj = response[key];
            var social = obj["social"];
            var handle = obj["handle"];
            var link = "";

            if (handle == null) {
                handle = "";
            }

            if (handle != "") {
                link = "http://" + social.toLowerCase() + ".com/" + handle;
                link = `<a href="${link}" target="_blank">@${handle}</a>`;
            }

            adminContent.innerHTML += `<div class="block" style="background-image: url(../assets/admin/images/background-${social.toLowerCase()}.svg); background-blend-mode: color-dodge;">
                <h2>${social}</h2>
                <span>${link}</span>
                <i class="fas fa-pencil-alt block-button" style="right: 20px;" title="Edit Social Link" onclick="openEditSocial('${social}', '${handle}');"></i>
            </div>`;
        }
    });
}

/*
    Change the contents of the modal to edit a social link
 */
window.openEditSocial = function(social, handle) {
    var modal = document.getElementById('modal');
    
    modal.innerHTML = `<table style="width: 100%;">
        <td><h3 class="modal-heading">Edit Social Link</h3></td>
        <td style="text-align: right;"><i class="fas fa-times modal-button" onclick="closeModal();"></i></td>
    </table>
    <input id="social-handle" class="text-box-primary" type="text" value="${handle}" placeholder="${social} Handle" autocomplete="off" spellcheck="false" onkeyup="keyUp(event);"></input>
    <input class="btn-primary" type="button" style="margin-top: 10px;" value="Save Changes" title="Save Changes" onclick="editSocial(this, '${social}');"></input>`;

    showModal();
}

/*
    Editing a social link
 */
window.editSocial = function(saveButton, social) {
    toggleInput(saveButton);

    var handle = document.getElementById('social-handle').value;

    $.ajax({
        type: 'POST',
        data: {
            social: social,
            handle: handle
        },
        url: '/social/edit',
        error: function(error) {
            displayServerError();
            toggleInput(saveButton);
        }
    }).then((response) => {
        if (response == 'success') {
            closeModal();
            displaySuccess('Your social link has been saved.')
            renderSocial(null);
        } else {
            displayError(response);
            toggleInput(saveButton);
        }
    });
}
