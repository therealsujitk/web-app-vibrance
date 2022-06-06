/*
    Setting up the page once it's loaded
 */
function setUp() {
    setTimeout(function() {
        document.getElementById('username').focus();    // Focus on the username box after the modal is visible
    }, 300);
}

/*
    Checking for key-up events
 */
function keyUp(event) {
    if (event.target.id === 'username') {
        if(event.keyCode === 13) {
            document.getElementById('password').focus();
        }
    } else if (event.target.id == 'password') {
        if(event.keyCode === 13) {
            signIn();
        }
    }
}

/*
    Function to sign in to the admin panel
 */
function signIn() {
    var logInButton = document.getElementById('login');
    toggleInput(logInButton);

    var errorMessage = document.getElementById('error-message');
    errorMessage.style.display = 'none';

    var username = document.getElementById('username').value;
    var password = document.getElementById('password').value;

    $.ajax({
        type: 'POST',
        url: '/admin-login',
        data: {
            username: username,
            password: password
        },
        error: function(error) {
            errorMessage.innerText = 'There was a problem connecting to the server, please try again later.';
            errorMessage.style.display = 'block';
            toggleInput(logInButton);
        }
    }).then((response) => {
        if (response === 'success') {
            location.reload();
        } else {
            errorMessage.innerText = response;
            errorMessage.style.display = 'block';
            toggleInput(logInButton);
        }
    });
}

/*
    Setting the input to loading when clicked
 */
var inputs = {};

function toggleInput(input) {
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
