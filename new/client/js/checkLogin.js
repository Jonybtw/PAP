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

async function validateToken() {
    const token = getCookie('token');
    
    if (!token) {
        // Token not found, redirect to login page
        if (!window.location.pathname.includes('login.html') && !window.location.pathname.includes('register.html') && !window.location.pathname.includes('profile.html')) {
            window.location.href = "../../pages/auth/login.html";
        } else if (window.location.pathname.includes('profile.html')) {
            window.location.href = "../../pages/auth/login.html";
        }
        return; // Exit function
    }
    
    try {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', `http://127.0.0.1:420/validate_token?token=${encodeURIComponent(token)}`);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.onreadystatechange = function() {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                if (xhr.status === 200) {
                    console.log('Token is valid');
                } else {
                    console.log('Token is not valid');
                    // Token is not valid, delete the token cookie and redirect to login page
                    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                    window.location.href = "../../pages/auth/login.html";
                }
            }
        };
        xhr.send();
    } catch (error) {
        console.error('Error validating token:', error);
    }
}

validateToken();


