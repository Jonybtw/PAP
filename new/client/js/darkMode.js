function fetchUserInfo() {
    const xhr = new XMLHttpRequest();

    xhr.onload = function () {
        if (this.status === 200) {
            try {
                const user = JSON.parse(this.responseText);
                const isDarkMode = user.settings.isDarkMode;

                // Apply dark mode if enabled
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
        document.querySelector('header').classList.add('dark-mode');
        document.querySelector('footer').classList.add('dark-mode');
        document.querySelector('main').classList.add('dark-mode');
        toggleSwitch.checked = true;
        setDarkModeStyles();
    } else {
        document.body.classList.remove('dark-mode');
        document.querySelector('header').classList.remove('dark-mode');
        document.querySelector('footer').classList.remove('dark-mode');
        document.querySelector('main').classList.remove('dark-mode');
        toggleSwitch.checked = false;
        resetStyles();
    }
}

function setDarkModeStyles() {
    document.querySelector('.slogan .title').style.color = 'white';
    document.querySelector('.slogan .tagline').style.color = 'white';
    document.querySelector('.rounded-box').style.backgroundColor = '#2b3035';

    const noRouteFound = document.getElementById('noRouteFound');
    if (noRouteFound) {
        noRouteFound.style.color = 'white';
    }

    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.style.backgroundColor = 'white';
    }
}

function resetStyles() {
    document.querySelector('.slogan .title').style.color = '';
    document.querySelector('.slogan .tagline').style.color = '';
    document.querySelector('.rounded-box').style.backgroundColor = '';
    document.querySelector('.nav-link').style.color = "";
    document.querySelector('.nav-link.active').style.color = "";

    const noRouteFound = document.getElementById('noRouteFound');
    if (noRouteFound) {
        noRouteFound.style.color = '';
    }

    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.style.backgroundColor = '';
    }
}

window.addEventListener('load', fetchUserInfo);
