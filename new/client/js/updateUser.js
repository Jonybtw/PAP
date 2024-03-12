async function updateUserInfo() {
    // Gather updated data from HTML elements
    const updatedData = {
        username: document.getElementById('username').value,
        name: document.getElementById('name').value,
        birth: document.getElementById('birth').value,
        address: document.getElementById('address').value,
        routes: document.getElementById('routes').value.split(', '),
        contacts: {
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
        },
        settings: {
            isDarkMode: document.getElementById('isDarkMode').value,
            mainColor: document.getElementById('mainColor').value,
        },
        auth: {
            password: document.getElementById('password').value,
            role: document.getElementById('role').value,
        },
    };

    const token = getCookie('token');

    // Replace with the correct server endpoint (ensure proper CORS configuration)
    try {
        const response = await fetch('http://127.0.0.1:3512/user', {
            method: 'PUT',
            headers: {
                'Authorization': token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedData)
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error('Network response was not ok. Status: ' + response.status + ' Message: ' + text);
        }

        const data = await response.json();
        console.log('User information updated successfully:', data);
    } catch (error) {
        console.error('Failed to update user information:', error);
    }
}

// Attach the updateUserInfo function to the save button
document.getElementById('saveButton').addEventListener('click', updateUserInfo);
