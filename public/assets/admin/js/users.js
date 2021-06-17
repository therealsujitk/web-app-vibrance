/*
    Change the contents of the modal for the user menu
 */
window.openUserMenu = function(username) {
    var modal = document.getElementById('modal');
    
    modal.innerHTML = `<table>
        <td><h3 class="modal-heading">User Menu</h3></td>
        <td style="text-align: right;"><i class="fas fa-times modal-button" onclick="closeModal();"></i></td>
    </table>
    <p>Hello <b>${username}</b>!</p>
    <input class="btn-primary" type="button" style="margin-top: 10px;" value="Change Password" title="Change Password" onclick="openEditMyPassword('${username}')"></input>
    <input class="btn-primary" type="button" style="margin-top: 10px;" value="Log out" title="Log Out" onclick="signOut(this);"></input>`;

    showModal();
}

/*
    Change the contents of the modal to edit my password
 */
window.openEditMyPassword = function(username) {
    var modal = document.getElementById('modal');
    var timeout = 0;

    if (modal.classList.contains('show')) {
        closeModal();
        timeout = 300;
    }
    
    setTimeout(function() {
        modal.innerHTML = `<table>
            <td><h3 class="modal-heading">Change Password</h3></td>
            <td style="text-align: right;"><i class="fas fa-times modal-button" onclick="closeModal();"></i></td>
        </table>
        <p>Change password for <b>${username}.</b></p>
        <input id="current-password" class="text-box-primary" style="margin-bottom: 20px;" type="password" placeholder="Current Password" autocomplete="off" spellcheck="false" onkeyup="keyUp(event);"></input>
        <input id="password" class="text-box-primary" type="password" placeholder="New Password" autocomplete="off" spellcheck="false" onkeyup="keyUp(event);"></input>
        <input id="repeat-password" class="text-box-primary" type="password" placeholder="Repeat Password" autocomplete="off" spellcheck="false" onkeyup="keyUp(event);"></input>
        <input class="btn-primary" type="button" style="margin-top: 10px;" value="Save Changes" title="Save Changes" onclick="editMyPassword(this);"></input>`;

        showModal();
    }, timeout);
}

/*
    Changing my password
 */
window.editMyPassword = function(saveButton) {
    toggleInput(saveButton);

    var currentPassword = document.getElementById('current-password').value;
    var password = document.getElementById('password').value;
    var repeatPassword = document.getElementById('repeat-password').value;

    if (!validatePassword(password)) {
        toggleInput(saveButton);
        return;
    }

    if (password != repeatPassword) {
        displayError('Sorry, new passwords do not match.');
        toggleInput(saveButton);
        return;
    }

    $.ajax({
        type: 'POST',
        url: '/users/edit/my-password',
        data: {
            currentPassword: currentPassword,
            password: password,
            repeatPassword: repeatPassword
        },
        error: function(error) {
            displayServerError();
            toggleInput(logoutButton);
        }
    }).then((response) => {
        if (response == 'success') {
            displaySuccess('Your password has been changed.');
            closeModal();
        } else {
            displayError(response);
            toggleInput(saveButton);
        }
    });
}

/*
    Logging the user out
 */
window.signOut = function(logoutButton) {
    toggleInput(logoutButton);

    $.ajax({
        type: 'POST',
        url: '/admin-logout',
        error: function(error) {
            displayServerError();
            toggleInput(logoutButton);
        }
    }).then((response) => {
        location.reload();
    });
}

/*
    Render a new version of the users
 */
export function renderUsers(adminContent) {
    if (adminContent == null) {
        adminContent = document.getElementById('admin-content');
    }

    $.ajax({
        type: 'POST',
        url: '/users',
        error: function(error) {
            displayServerError();
        }
    }).then((response) => {
        adminContent.classList = "block-group";
        adminContent.innerHTML = `<div class="block clickable" onclick="openUser();" title="Add User">
            <div style="margin-top: 60px; transform: translate(0%, -50%);">
                <i class="fas fa-plus fa-3x" style="margin: 0px 0px 5px 0px;"></i>
                </br>
                <span>Add User</span>
            </div>
        </div>`;

        for (var key in response) {
            var obj = response[key];
            var id = obj["id"];
            var username = obj["username"];
            var userType = "Editor";

            if (obj["is_admin"] == 1) {
                userType = "Admin";
            }

            if (id == 1) {
                adminContent.innerHTML += `<div class="block" style="background-image: url(../assets/admin/images/background-user.svg); background-blend-mode: color-dodge;">
                    <h2>${username}</h2>
                    <span>${userType}</span>
                    <i class="fas fa-pencil-alt block-button" style="right: 20px;" title="Edit User" onclick="openEditPassword(${id}, '${username}', '${userType}');"></i>
                </div>`;
            } else {
                adminContent.innerHTML += `<div class="block" style="background-image: url(../assets/admin/images/background-user.svg); background-blend-mode: color-dodge;">
                    <h2>${username}</h2>
                    <span>${userType}</span>
                    <i class="fas fa-pencil-alt block-button" style="right: 45px;" title="Edit User" onclick="openEditUser(${id}, '${username}', '${userType}');"></i>
                    <i class="fas fa-times block-button" style="right: 20px;" title="Delete User" onclick="openDeleteUser(${id}, '${username}');"></i>
                </div>`;
            }
        }
    });
}

/*
    Change the contents of the modal to add a user
 */
window.openUser = function() {
    var modal = document.getElementById('modal');
    
    modal.innerHTML = `<table>
        <td><h3 class="modal-heading">Add User</h3></td>
        <td style="text-align: right;"><i class="fas fa-times modal-button" onclick="closeModal();"></i></td>
    </table>
    <input id="new-username" class="text-box-primary" type="text" placeholder="Username" autocomplete="off" spellcheck="false" onkeyup="keyUp(event);"></input>
    <input id="password" class="text-box-primary" type="password" placeholder="Password" autocomplete="off" spellcheck="false" onkeyup="keyUp(event);"></input>
    <input id="repeat-password" class="text-box-primary" type="password" placeholder="Repeat Password" autocomplete="off" spellcheck="false" onkeyup="keyUp(event);"></input>
    <select id="user-type" class="text-box-primary">
        <option value="admin">Admin</option>
        <option value="editor" selected>Editor</option>
    </select>
    <input class="btn-primary" type="button" style="margin-top: 10px;" value="Save Changes" title="Save Changes" onclick="addUser(this);"></input>`;

    showModal();
}

/*
    Adding a user
 */
window.addUser = function(saveButton) {
    toggleInput(saveButton);

    var username = document.getElementById('new-username').value;
    var password = document.getElementById('password').value;
    var repeatPassword = document.getElementById('repeat-password').value;
    var userType = document.getElementById('user-type').value;

    if (!validateUsername(username)) {
        toggleInput(saveButton);
        return;
    }

    if (!validatePassword(password)) {
        toggleInput(saveButton);
        return;
    }

    if (password != repeatPassword) {
        displayError('Sorry, passwords do not match.');
        toggleInput(saveButton);
        return;
    }

    $.ajax({
        type: 'POST',
        url: '/users/add',
        data: {
            username: username,
            password: password,
            repeatPassword,
            userType: userType
        },
        error: function(error) {
            displayServerError();
            toggleInput(logoutButton);
        }
    }).then((response) => {
        if (response == 'success') {
            closeModal();
            displaySuccessfulAdd('user');
            renderUsers(null);
        } else {
            displayError(response);
            toggleInput(saveButton);
        }
    });
}

/*
    Change the contents of the modal to edit a user
 */
window.openEditUser = function(id, username, userType) {
    var modal = document.getElementById('modal');
    
    modal.innerHTML = `<table>
        <td><h3 class="modal-heading">Edit User</h3></td>
        <td style="text-align: right;"><i class="fas fa-times modal-button" onclick="closeModal();"></i></td>
    </table>
    <p>Choose what to edit for <b>${username}</b>.</p>
    <input class="btn-primary" type="button" style="margin-top: 10px;" value="Change Password" title="Change Password" onclick="openEditPassword(${id}, '${username}');"></input>
    <input class="btn-primary" type="button" style="margin-top: 10px;" value="Change User Permission" title="Change User Permission" onclick="openEditType(${id}, '${username}', '${userType}');"></input>`;

    showModal();
}

/*
    Change the contents of the modal to edit the password
 */
window.openEditPassword = function(id, username) {
    var modal = document.getElementById('modal');
    var timeout = 0;

    if (modal.classList.contains('show')) {
        closeModal();
        timeout = 300;
    }
    
    setTimeout(function() {
        modal.innerHTML = `<table>
            <td><h3 class="modal-heading">Change Password</h3></td>
            <td style="text-align: right;"><i class="fas fa-times modal-button" onclick="closeModal();"></i></td>
        </table>
        <p>Change password for <b>${username}.</b></p>
        <input id="password" class="text-box-primary" type="password" placeholder="Password" autocomplete="off" spellcheck="false" onkeyup="keyUp(event);"></input>
        <input id="repeat-password" class="text-box-primary" type="password" placeholder="Repeat Password" autocomplete="off" spellcheck="false" onkeyup="keyUp(event);"></input>
        <input class="btn-primary" type="button" style="margin-top: 10px;" value="Save Changes" title="Save Changes" onclick="editPassword(this, ${id});"></input>`;

        showModal();
    }, timeout);
}

/*
    Changing a user's password
 */
window.editPassword = function(saveButton, id) {
    toggleInput(saveButton);

    var password = document.getElementById('password').value;
    var repeatPassword = document.getElementById('repeat-password').value;

    if (!validatePassword(password)) {
        toggleInput(saveButton);
        return;
    }

    if (password != repeatPassword) {
        displayError('Sorry, passwords do not match.');
        toggleInput(saveButton);
        return;
    }

    $.ajax({
        type: 'POST',
        url: '/users/edit/password',
        data: {
            id: id,
            password: password,
            repeatPassword
        },
        error: function(error) {
            displayServerError();
            toggleInput(logoutButton);
        }
    }).then((response) => {
        if (response == 'success') {
            closeModal();
            displaySuccessfulEdit('user');
            renderUsers(null);
        } else {
            displayError(response);
            toggleInput(saveButton);
        }
    });
}

/*
    Change the contents of the modal to edit the users permission
 */
window.openEditType = function(id, username, userType) {
    var modal = document.getElementById('modal');
    var timeout = 0;

    if (modal.classList.contains('show')) {
        closeModal();
        timeout = 300;
    }

    var adminSelection = "";
    var editorSelection = "";

    if (userType.toLowerCase().includes('admin')) {
        adminSelection = " selected";
    } else {
        editorSelection = " selected";
    }
    
    setTimeout(function() {
        modal.innerHTML = `<table>
            <td><h3 class="modal-heading">Change Permission</h3></td>
            <td style="text-align: right;"><i class="fas fa-times modal-button" onclick="closeModal();"></i></td>
        </table>
        <p>Change user permission for <b>${username}.</b></p>
        <select id="user-type" class="text-box-primary">
            <option value="admin"${adminSelection}>Admin</option>
            <option value="editor"${editorSelection}>Editor</option>
        </select>
        <input class="btn-primary" type="button" style="margin-top: 10px;" value="Save Changes" title="Save Changes" onclick="editType(this, ${id});"></input>`;

        showModal();
    }, timeout);
}

/*
    Changing a user's permission
 */
window.editType = function(saveButton, id) {
    toggleInput(saveButton);

    var userType = document.getElementById('user-type').value;

    $.ajax({
        type: 'POST',
        url: '/users/edit/permission',
        data: {
            id: id,
            userType: userType
        },
        error: function(error) {
            displayServerError();
            toggleInput(logoutButton);
        }
    }).then((response) => {
        if (response == 'success') {
            closeModal();
            displaySuccessfulEdit('user');
            renderUsers(null);
        } else {
            displayError(response);
            toggleInput(saveButton);
        }
    });
}

/*
    Change the contents of the modal to delete a user
 */
window.openDeleteUser = function(id, username) {
    var modal = document.getElementById('modal');
    
    modal.innerHTML = `<table style="width: 100%;">
        <td><h3 class="modal-heading">Delete User</h3></td>
        <td style="text-align: right;"><i class="fas fa-times modal-button" onclick="closeModal();"></i></td>
    </table>
    <p>Are you sure you want to delete <b>${username}</b>? This action cannot be undone.</p>
    <input class="btn-primary" type="button" style="margin-top: 10px;" value="Yeah, I'm sure" title="Delete this user" onclick="deleteUser(this, ${id});"></input>`;

    showModal();
}

/*
    Deleting a user
 */
window.deleteUser = function(saveButton, id) {
    toggleInput(saveButton);

    $.ajax({
        type: 'POST',
        url: '/users/delete',
        data: {
            id: id
        },
        error: function(error) {
            displayServerError();
            toggleInput(logoutButton);
        }
    }).then((response) => {
        if (response == 'success') {
            closeModal();
            displaySuccessfulDelete('user');
            renderUsers(null);
        } else {
            displayError(response);
            toggleInput(saveButton);
        }
    });
}

/*
    Username validation
 */
function validateUsername(username) {
    if(username.match(/\W/)){
        displayError('Sorry, username cannot contain special characters or spaces.');
        return false;
    } else if (username.length < 3) {
        displayError('Sorry, your username needs to have atleast 3 characters.')
    } else if (username.length > 20) {
        displayError('Sorry, your username cannot have more than 20 characters.');
        return false;
    }

    return true;
}

/*
    Password validation
 */
function validatePassword(password) {
    if(password != password.trim()){
        displayError('Sorry, your password cannot contain trailing spaces.');
        return false;
    } else if (password.length < 8) {
        displayError('Sorry, your password needs to have atleast 8 characters.');
        return false;
    } else if (password.length > 20) {
        displayError('Sorry, your password cannot have more than 20 characters.');
        return false;
    }

    return true;
}
