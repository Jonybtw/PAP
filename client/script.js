function toggleSidebar() {
  var sidebar = document.querySelector('.sidebar');
  sidebar.style.width = sidebar.style.width === '250px' ? '0' : '250px';
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



