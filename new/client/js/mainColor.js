function fetchUserInfo() {
    const xhr = new XMLHttpRequest();

    xhr.onload = function () {
        if (this.status === 200) {
            try {
                const user = JSON.parse(this.responseText);
                const mainColor = user.settings.mainColor;
                document.documentElement.style.setProperty('--main-color', mainColor);
            } catch (error) {
                console.error('Erro ao analisar os dados do utilizador:', error);
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
