function toggleSidebar() {
  var sidebar = document.querySelector('.sidebar');
  var overlay = document.querySelector('.overlay');

  if (sidebar.style.width === '250px') {
    sidebar.style.width = '0';
    overlay.style.display = 'none';
  } else {
    sidebar.style.width = '250px';
    overlay.style.display = 'block';
  }
}

function login() {
  window.location.href = "login.html";
}

function register() {
  window.location.href = "registo.html";
}

function redirectToIndex() {
  window.location.href = "index.html";
}


/*
let params = new URLSearchParams();
params.append('username', vardoUser);
params.append('password', password);

let result = await axios.post('/login', params, {})
if (!result) ..
else {
  login -> redirect
}
*/



