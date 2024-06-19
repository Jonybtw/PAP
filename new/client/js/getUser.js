function fetchUserInfo() {
    const xhr = new XMLHttpRequest();

    xhr.onload = function () {
        if (this.status === 200) {
            try {
                const user = JSON.parse(this.responseText);

                const userId = user._id;
                const username = user.data.username;
                const name = user.data.name;
                const birth = user.data.birth;
                const address = user.data.address;
                const email = user.contacts.email;
                const phone = user.contacts.phone;
                const isDarkMode = user.settings.isDarkMode === true;
                const mainColor = user.settings.mainColor;

                document.getElementById('username').value = username;
                document.getElementById('name').value = name;
                document.getElementById('birth').value = birth;
                document.getElementById('address').value = address;
                document.getElementById('email').value = email;
                document.getElementById('phone').value = phone;
                document.getElementById('isDarkMode').checked = isDarkMode;
                document.getElementById('mainColor').value = mainColor;

            } catch (error) {
                console.error('Erro na análise dos dados do utilizador:', error);
            }
        } else {
            console.error('Falha ao obter informações do utilizador:', this.statusText);
        }
    };

    xhr.onerror = function () {
        console.error('Erro de rede ao obter informações do utilizador');
    };
    xhr.open('GET', 'http://127.0.0.1:420/user');
    xhr.setRequestHeader('Authorization', getCookie('token'));
    xhr.send();
}

window.addEventListener('load', fetchUserInfo);
