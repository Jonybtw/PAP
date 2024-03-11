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

if (!getCookie('token')) {
    if (!window.location.pathname.includes('login.html') && !window.location.pathname.includes('register.html') && !window.location.pathname.includes('profile.html')) {
        window.location.href = "../../pages/auth/login.html";
    } else if (window.location.pathname.includes('profile.html')) {
        window.location.href = "../../pages/auth/login.html";
    }
} else {
    if (window.location.pathname.includes('login.html') || window.location.pathname.includes('register.html')) {
        window.location.href = "../../index.html";
    }
}
