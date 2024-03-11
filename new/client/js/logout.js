// logout.js
window.onload = function() {
    var logoutButtons = document.getElementsByClassName('logoutButton');

    for (var i = 0; i < logoutButtons.length; i++) {
        logoutButtons[i].addEventListener('click', function() {
            // Check if the "token" cookie exists
            if (document.cookie.indexOf('token=') !== -1) {
                // Delete the "token" cookie
                document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                
                // Check if the cookie was successfully destroyed
                if (document.cookie.indexOf('token=') === -1) {
                    console.log('Cookie destroyed successfully');
                    // Redirect to the login page
                    window.location.href = '../../pages/auth/login.html';
                } else {
                    console.log('Failed to destroy cookie');
                }
            } else {
                console.log('Cookie does not exist');
            }
        });
    }
}