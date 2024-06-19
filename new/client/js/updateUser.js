function updateUserInfo() {
    const name = document.getElementById('name').value;
    const birth = document.getElementById('birth').value;
    const address = document.getElementById('address').value;
    const emailField = document.getElementById('email');
    const email = emailField.value;
    const phoneField = document.getElementById('phone');
    const phone = phoneField.value;
    const isDarkMode = document.getElementById('isDarkMode').checked;
    const mainColor = document.getElementById('mainColor').value;
    const password = document.getElementById('password').value;

    if (!emailField.checkValidity()) {
        alert('Por favor, insira um endereço de email válido.');
        return;
    }

    if (!/^\d+$/.test(phone)) {
        alert('Por favor, insira um número de telefone válido contendo apenas dígitos.');
        return;
    }

    const formData = new URLSearchParams();
    
    formData.append('name', name);
    formData.append('birth', birth);
    formData.append('address', address);
    formData.append('email', email);
    formData.append('phone', phone);
    formData.append('isDarkMode', isDarkMode);
    formData.append('mainColor', mainColor);
    formData.append('password', password);

    const xhr = new XMLHttpRequest();

    xhr.onload = function () {
        if (this.status === 200) {
            alert('Dados do utilizador atualizados com sucesso.');
        } else {
            console.error('Erro ao atualizar os dados do utilizador:', this.statusText);
            alert('Erro ao atualizar os dados do utilizador. Por favor, tente novamente mais tarde.');
        }
        location.reload();
    };

    xhr.onerror = function () {
        console.error('Erro de rede ao atualizar as informações do utilizador');
        alert('Erro de rede ao atualizar as informações do utilizador. Por favor, tente novamente mais tarde.');
    };

    xhr.open('PUT', 'http://127.0.0.1:420/user');

    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.setRequestHeader('Authorization', getCookie('token'));

    xhr.send(formData);
}

document.getElementById('saveButton').addEventListener('click', updateUserInfo);
