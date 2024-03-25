function updateUserInfo() {
    // Retrieve updated user information from the form
    const name = document.getElementById('name').value;
    const birth = document.getElementById('birth').value;
    const address = document.getElementById('address').value;
    const emailField = document.getElementById('email');
    const email = emailField.value;
    const phoneField = document.getElementById('phone');
    const phone = phoneField.value;
    const isDarkMode = document.getElementById('isDarkMode').checked; // Retrieve the value of the checkbox
    const mainColor = document.getElementById('mainColor').value;
    const password = document.getElementById('password').value;

    // Check if the email is in the correct format
    if (!emailField.checkValidity()) {
        alert('Please enter a valid email address.');
        return;
    }

    // Check if the phone contains only numbers
    if (!/^\d+$/.test(phone)) {
        alert('Please enter a valid phone number containing only digits.');
        return;
    }

    // Create a URLSearchParams object to store the form-encoded data
    const formData = new URLSearchParams();
    
    // Append the updated user information to the formData
    formData.append('name', name);
    formData.append('birth', birth);
    formData.append('address', address);
    formData.append('email', email);
    formData.append('phone', phone);
    formData.append('isDarkMode', isDarkMode);
    formData.append('mainColor', mainColor);
    formData.append('password', password);

    // Create an instance of XMLHttpRequest
    const xhr = new XMLHttpRequest();

    // Define the onload function to handle the response
    xhr.onload = function () {
        if (this.status === 200) {
            alert('User data updated successfully.');
        } else {
            console.error('Error updating user data:', this.statusText);
            alert('Error updating user data. Please try again later.');
        }
        location.reload();
    };

    // Define the onerror function to handle errors
    xhr.onerror = function () {
        console.error('Network error while updating user information');
        alert('Network error while updating user information. Please try again later.');
    };

    // Open a PUT request to the server endpoint
    xhr.open('PUT', 'http://127.0.0.1:3512/user'); // Replace with your actual URL

    // Set the request headers
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.setRequestHeader('Authorization', getCookie('token')); // Use Bearer token format

    // Send the form-encoded data in the request body
    xhr.send(formData);
}

// Call the updateUserInfo function when the save button is clicked
document.getElementById('saveButton').addEventListener('click', updateUserInfo);
