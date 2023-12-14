const xhr = new XMLHttpRequest();
let loginDiv = document.getElementById('login-btn');

window.onload = () => {
    if (!localStorage.getItem('user')) {
        xhr.open('GET', 'http://127.0.0.1:5000/user', true);
		xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
		xhr.setRequestHeader('Authorization', localStorage.getItem('token'));
		xhr.onreadystatechange = () => {
			if (xhr.readyState == 4 && xhr.status == 200) {
				localStorage.setItem('user', xhr.responseText);
			}
		}
		xhr.send();
    }
    if (localStorage.getItem('token') && localStorage.getItem('user')) {
        loginDiv.innerHTML = `<h1>Olá, ${JSON.parse(localStorage.getItem('user')).data.username}</h1>`;
    }
}