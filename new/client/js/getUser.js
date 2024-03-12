function getCookie(cname) {
  let name = cname + "=";
  let ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) === 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

function fetchUserInfo() {
  const xhr = new XMLHttpRequest();

  xhr.onload = function () {
    if (this.status === 200) {
      try {
        const user = JSON.parse(this.responseText);

        // Access individual data points
        const userId = user._id;
        const username = user.data.username;
        const name = user.data.name;
        const birth = user.data.birth;
        const address = user.data.address;
        const routes = user.data.routes; // Array of routes
        const email = user.contacts.email;
        const phone = user.contacts.phone;
        const isDarkMode = user.settings.isDarkMode;
        const mainColor = user.settings.mainColor;
        const password = user.auth.password; // **Note: Avoid accessing password directly.**
        const role = user.auth.role;

        // Update HTML elements with retrieved information (excluding password)
        document.getElementById('username').value = username;
        document.getElementById('name').value = name;
        document.getElementById('birth').value = birth;
        document.getElementById('address').value = address;
        document.getElementById('routes').value = routes;
        document.getElementById('email').value = email;
        document.getElementById('phone').value = phone;
        document.getElementById('isDarkMode').value = isDarkMode;
        document.getElementById('mainColor').value = mainColor;
        document.getElementById('password').value = password;
        document.getElementById('role').value = role;

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
  xhr.open('GET', 'http://127.0.0.1:3512/user'); // Replace with your actual URL
  xhr.setRequestHeader('Authorization', getCookie('token'));
  xhr.send();
}

// Call the fetchUserInfo function when the page loads
window.addEventListener('load', fetchUserInfo);