/*
    Render a new version of the dashboard
 */
export function renderSettings(adminContent) {
    if (adminContent == null) {
        adminContent = document.getElementById('admin-content');
    }

    $.ajax({
        type: 'POST',
        url: '/settings',
        error: function(error) {
            displayServerError();
        }
    }).then((response) => {
        var title = response["title"];
        var description = response["description"];
        var openingDate = response["opening_date"];
        var openingTime = response["opening_time"];

        if (typeof title == "undefined") {
            displayError(response);
        } else {
            adminContent.classList = "form-group";
            adminContent.innerHTML = `<label>Site Title</label>
            <input id="site-title" class="text-box-secondary" type="text" value="${title}" autocomplete="off" spellcheck="false"></input>

            <label>Site Description</label>
            <p class="setting-description">This will appear in the meta tag and show up in search engines.</p>
            <textarea id="site-description" class="text-box-secondary" type="text" autocomplete="off" spellcheck="true">${description}</textarea>

            <br>
            <label>Opening Date</label>
            <p class="setting-description">The date when the festival begins. This will be used for the countdown.</p>
            <input id="opening-date" class="text-box-secondary" type="date" value="${openingDate}" autocomplete="off"></input>

            <label>Opening Time</label>
            <p class="setting-description">The time at which the festival begins. This will be used for the countdown.</p>
            <input id="opening-time" class="text-box-secondary" type="time" value="${openingTime}" autocomplete="off"></input>

            <input class="btn-secondary" type="button" value="Save Changes" title="Save Changes" onclick="saveSettings(this);"></input>`;
        }
    });
}

/*
    Saving the Dashboard
 */
window.saveSettings = function(saveButton) {
    toggleInput(saveButton);

    var title = document.getElementById('site-title').value;
    var description = document.getElementById('site-description').value;
    var date = document.getElementById('opening-date').value;
    var time = document.getElementById('opening-time').value;

    $.ajax({
        type: 'POST',
        data: {
            title: title,
            description: description,
            date: date,
            time: time
        },
        url: '/settings/save',
        error: function(error) {
            displayServerError();
            toggleInput(saveButton);
        }
    }).then((response) => {
        if (response == 'success') {
            displaySuccess('Your settings have been saved.');
            renderSettings(null);
        } else {
            displayError(response);
            toggleInput(saveButton);
        }
    });
}
