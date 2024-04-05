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

// JavaScript
async function validateToken() {
    const token = getCookie('token');
    const response = await fetch('/validate_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `token=${encodeURIComponent(token)}`
    });
  
    if (response.ok) {
      console.log('Token is valid');
    } else {
      console.log('Token is not valid');
      document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'; // Delete the token cookie
    }
  }
  
  validateToken();
