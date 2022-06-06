/*
    Render a new version of the categories
 */
export function renderCategories(adminContent) {
    if (adminContent == null) {
        adminContent = document.getElementById('admin-content');
    }

    $.ajax({
        type: 'POST',
        url: '/categories',
        error: function(error) {
            displayServerError();
        }
    }).then((response) => {
        adminContent.classList = "block-group";
        adminContent.innerHTML = `<div class="block clickable" onclick="openCategory();" title="Add Category">
            <div style="margin-top: 60px; transform: translate(0%, -50%);">
                <i class="fas fa-plus fa-3x" style="margin: 0px 0px 5px 0px;"></i>
                </br>
                <span>Add Category</span>
            </div>
        </div>`;

        for (var key in response) {
            var obj = response[key];
            var id = obj["id"];
            var category = obj["category"];
            var categoryType = obj["category_type"];
            var image = obj["image"];

            adminContent.innerHTML += `<div class="block" style="background-image: url(${image});">
                <h2>${category}</h2>
                <span>${categoryType}</span>
                <i class="fas fa-pencil-alt block-button" style="right: 45px;" title="Edit Category" onclick="openEditCategory(${id}, '${category}', '${categoryType}', '${image}');"></i>
                <i class="fas fa-times block-button" style="right: 20px;" title="Delete Categroy" onclick="openDeleteCategory(${id}, '${category}');"></i>
            </div>`;
        }
    });
}

/*
    Change the contents of the modal to add a category
 */
window.openCategory = function() {
    var modal = document.getElementById('modal');
    
    modal.innerHTML = `<table style="width: 100%;">
        <td><h3 class="modal-heading">Add Category</h3></td>
        <td style="text-align: right;"><i class="fas fa-times modal-button" onclick="closeModal();"></i></td>
    </table>
    <input id="cat-title" class="text-box-primary" type="text" placeholder="Category Title" autocomplete="off" spellcheck="false" onkeyup="keyUp(event);"></input>
    <select id="cat-type" class="text-box-primary">
        <option value="club">Club</option>
        <option value="chapter">Chapter</option>
    </select>
    <input id="cat-image" class="text-box-primary" type="text" placeholder="Image URL" autocomplete="off" spellcheck="false" onkeyup="keyUp(event);"></input>
    <input class="btn-primary" type="button" style="margin-top: 10px;" value="Save Changes" title="Save Changes" onclick="addCategory(this);"></input>`;

    showModal();
}

/*
    Adding a category
 */
window.addCategory = function(saveButton) {
    toggleInput(saveButton);

    var category = document.getElementById('cat-title').value;
    var categoryType = document.getElementById('cat-type').value;
    var image = document.getElementById('cat-image').value;

    $.ajax({
        type: 'POST',
        data: {
            category: category,
            categoryType: categoryType,
            image: image
        },
        url: '/categories/add',
        error: function(error) {
            displayServerError();
            toggleInput(saveButton);
        }
    }).then((response) => {
        if (response == 'success') {
            closeModal();
            displaySuccessfulAdd('category');
            renderCategories(null);
        } else {
            displayError(response);
            toggleInput(saveButton);
        }
    });
}

/*
    Change the contents of the modal to edit a category
 */
window.openEditCategory = function(id, title, type, image) {
    var modal = document.getElementById('modal');
    var clubSelection = "", chapterSelection = "";

    if(type.toLowerCase().includes('club')) {
        clubSelection = " selected";
    } else {
        chapterSelection = " selected";
    }
    
    modal.innerHTML = `<table style="width: 100%;">
        <td><h3 class="modal-heading">Edit Category</h3></td>
        <td style="text-align: right;"><i class="fas fa-times modal-button" onclick="closeModal();"></i></td>
    </table>
    <input id="cat-title" class="text-box-primary" type="text" value="${title}" placeholder="Category Title" autocomplete="off" spellcheck="false" onkeyup="keyUp(event);"></input>
    <select id="cat-type" class="text-box-primary">
        <option value="club"${clubSelection}>Club</option>
        <option value="chapter"${chapterSelection}>Chapter</option>
    </select>
    <input id="cat-image" class="text-box-primary" type="text" value="${image}" placeholder="Image URL" autocomplete="off" spellcheck="false" onkeyup="keyUp(event);"></input>
    <input class="btn-primary" type="button" style="margin-top: 10px;" value="Save Changes" title="Save Changes" onclick="editCategory(this, ${id});"></input>`;

    showModal();
}

/*
    Editing a category
 */
window.editCategory = function(saveButton, id) {
    toggleInput(saveButton);

    var category = document.getElementById('cat-title').value;
    var categoryType = document.getElementById('cat-type').value;
    var image = document.getElementById('cat-image').value;

    $.ajax({
        type: 'POST',
        data: {
            id: id,
            category: category,
            categoryType: categoryType,
            image: image
        },
        url: '/categories/edit',
        error: function(error) {
            displayServerError();
            toggleInput(saveButton);
        }
    }).then((response) => {
        if (response == 'success') {
            closeModal();
            displaySuccessfulEdit('category');
            renderCategories(null);
        } else {
            displayError(response);
            toggleInput(saveButton);
        }
    });
}

/*
    Change the contents of the modal to delete a category
 */
window.openDeleteCategory = function(id, category) {
    var modal = document.getElementById('modal');
    
    modal.innerHTML = `<table style="width: 100%;">
        <td><h3 class="modal-heading">Delete Category</h3></td>
        <td style="text-align: right;"><i class="fas fa-times modal-button" onclick="closeModal();"></i></td>
    </table>
    <p>Are you sure you want to delete <b>${category}</b>? This action cannot be undone.</p>
    <input class="btn-primary" type="button" style="margin-top: 10px;" value="Yeah, I'm sure" title="Delete this category" onclick="deleteCategory(this, ${id});"></input>`;

    showModal();
}

/*
    Deleting a category
 */
window.deleteCategory = function(saveButton, id) {
    toggleInput(saveButton);

    $.ajax({
        type: 'POST',
        data: {
            id: id
        },
        url: '/categories/delete',
        error: function(error) {
            displayServerError();
            toggleInput(saveButton);
        }
    }).then((response) => {
        if (response == 'success') {
            closeModal();
            displaySuccessfulDelete('category');
            renderCategories(null);
        } else {
            displayError(response);
            toggleInput(saveButton);
        }
    });
}
