const xhr = new XMLHttpRequest();
window.onload = () => {
	if (localStorage.getItem('token')) {
		window.location.replace('http://127.0.0.1:5500/client/index.html');
	}
}

const form = document.getElementById('login');
form.addEventListener('submit', async (e) => {
	e.preventDefault();
	let username = form.elements['username'].value;
	let password = form.elements['password'].value;
	
	if (username && password) {
		let params = new URLSearchParams();
		params.append('username', username);
		params.append('password', password);
		xhr.open('POST', 'http://127.0.0.1:5000/login', true);
		xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
		xhr.onreadystatechange = () => {
			if (xhr.readyState == 4 && xhr.status == 200) {
				localStorage.setItem('token', xhr.responseText.slice(1, -1));
			}
		}
		xhr.send(params);
	}

});