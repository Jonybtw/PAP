function fetchUserInfo() {
    const xhr = new XMLHttpRequest();

    xhr.onload = function () {
        if (this.status === 200) {
            try {
                const user = JSON.parse(this.responseText);
                const mainColor = user.settings.mainColor;

                // Update HTML elements with retrieved information (excluding password)
                document.documentElement.style.setProperty('--main-color', mainColor);
                // Use appropriate data types if needed (e.g., Date object for birth)
            } catch (error) {
                console.error('Error parsing user data:', error);
            }
        } else {
            console.error('Failed to fetch user information:', this.statusText);
        }
    };

    xhr.onerror = function () {
        console.error('Network error while fetching user information');
    };

    // Replace with the correct server endpoint (ensure proper CORS configuration)
    xhr.open('GET', 'http://127.0.0.1:420/user'); // Replace with your actual URL
    xhr.setRequestHeader('Authorization', getCookie('token'));
    xhr.send();
}

// Call the fetchUserInfo function when the page loads
window.addEventListener('load', fetchUserInfo);
