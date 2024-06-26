function getCookie(cname) {
  let name = cname + "=";
  let ca = document.cookie.split(";");
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == " ") {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

if (getCookie("token")) {
  var loginBtn = document.getElementById("loginBtn");
  if (loginBtn) {
    loginBtn.style.display = "none";
  }

  var registerBtn = document.getElementById("registerBtn");
  if (registerBtn) {
    registerBtn.style.display = "none";
  }

  var perfilBtn = document.getElementById("perfilBtn");
  if (perfilBtn) {
    perfilBtn.style.display = "block";
  }

  var routesBtn = document.getElementById("routesBtn");
  if (routesBtn) {
    routesBtn.style.display = "block";
  }
}
