function fetchUserInfo() {
    const xhr = new XMLHttpRequest();

    xhr.onload = function () {
        if (this.status === 200) {
            try {
                const user = JSON.parse(this.responseText);
                const isDarkMode = user.settings.isDarkMode;

                if (isDarkMode) {
                    applyTheme('dark');
                } else {
                    applyTheme('light');
                }
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

function applyTheme(theme) {
    const toggleSwitch = document.getElementById('isDarkMode');

    if (theme === 'dark') {
        document.body.classList.add('dark-mode');
        document.body.classList.remove('light-mode');
        document.querySelector('header').classList.add('dark-mode');
        document.querySelector('header').classList.remove('light-mode');
        document.querySelector('footer').classList.add('dark-mode');
        document.querySelector('footer').classList.remove('light-mode');
        document.querySelector('main').classList.add('dark-mode');
        document.querySelector('main').classList.remove('light-mode');
        toggleSwitch.checked = true;
        setDarkModeStyles();
    } else {
        document.body.classList.add('light-mode');
        document.body.classList.remove('dark-mode');
        document.querySelector('header').classList.remove('dark-mode');
        document.querySelector('footer').classList.remove('dark-mode');
        document.querySelector('main').classList.remove('dark-mode');
        toggleSwitch.checked = false;
        setLightModeStyles();
    }
}

function setDarkModeStyles() {
    document.querySelector('.slogan .title').style.color = 'white';
    document.querySelector('.slogan .tagline').style.color = 'white';
    document.querySelector('.rounded-box').style.backgroundColor = '#2b3035';

    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.style.color = 'white';
    });

    const noRouteFound = document.getElementById('noRouteFound');
    if (noRouteFound) {
        noRouteFound.style.color = 'white';
    }

    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.style.backgroundColor = '#2b3035';
    }
}

function setLightModeStyles() {
    document.querySelector('.slogan .title').style.color = 'black';
    document.querySelector('.slogan .tagline').style.color = 'black';

    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.style.color = 'black';
    });

    const noRouteFound = document.getElementById('noRouteFound');
    if (noRouteFound) {
        noRouteFound.style.color = 'black';
    }

    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.style.backgroundColor = '#f8f9fa';
    }
}

window.addEventListener('load', fetchUserInfo);
