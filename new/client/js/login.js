function getCookie(cname) {
    let name = cname + "=";
    let ca = document.cookie.split(';');
    for(let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

window.onload = () => {
    var loginBtn = document.getElementById('loginBtn');
    var registerBtn = document.getElementById('registerBtn');

    if (getCookie('token')) {
        loginBtn.style.display = 'none';
        registerBtn.style.display = 'none';
        var perfilBtn = document.getElementById('perfilBtn');
        perfilBtn.style.display = 'block';
        var routesBtn = document.getElementById('routesBtn');
        routesBtn.style.display = 'block';
    }
}