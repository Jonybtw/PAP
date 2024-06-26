document.addEventListener("DOMContentLoaded", () => {
    const deleteUserButton = document.getElementById("deleteUserButton");

    deleteUserButton.addEventListener("click", (event) => {
        event.preventDefault();

        const userConfirmed = confirm("Tem a certeza que quer apagar a sua conta? Não poderá desfazer esta ação.");

        if (userConfirmed) {
            const token = getCookie('token');

            const xhr = new XMLHttpRequest();
            xhr.open('DELETE', 'http://127.0.0.1:420/user', true);
            xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
            xhr.setRequestHeader('Authorization', token);

            xhr.onload = function() {
                if (xhr.status >= 200 && xhr.status < 300) {
                    const result = JSON.parse(xhr.responseText);
                    alert(result);

                    localStorage.clear();
                    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                    setTimeout(() => {
                        window.location.href = '../../pages/auth/login.html';
                    }, 500);
                } else {
                    throw new Error(`Error: ${xhr.statusText}`);
                }
            };

            xhr.onerror = function() {
                console.error('Erro ao apagar utilizador:', xhr.statusText);
                alert('Falha ao apagar a sua conta. Por favor tente mais tarde.');
            };

            xhr.send(); // No request body needed for DELETE
        }
    });
});
