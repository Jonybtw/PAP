const form = document.getElementById('login');
form.addEventListener('submit', (e) => {
	e.preventDefault();
	let username = form.elements['username'].value;
	let password = form.elements['password'].value;
	
	if (username && password) {
		console.log(username, password)
	}
});