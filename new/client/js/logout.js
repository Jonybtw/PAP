window.onload = function() {
    var logoutButtons = document.getElementsByClassName('logoutButton');

    for (var i = 0; i < logoutButtons.length; i++) {
        logoutButtons[i].addEventListener('click', function() {
            if (document.cookie.indexOf('token=') !== -1) {
                document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                
                if (document.cookie.indexOf('token=') === -1) {
                    console.log('Cookie destruído com sucesso');
                    localStorage.clear();
                    window.location.href = '../../pages/auth/login.html';
                } else {
                    console.log('Falha ao destruir o cookie');
                }
            } else {
                console.log('Cookie não existe');
            }
        });
    }
}