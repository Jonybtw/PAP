document.addEventListener('DOMContentLoaded', function() {
    const toggleSwitch = document.getElementById('isDarkMode');
    const colorPicker = document.getElementById('mainColor');
    const currentTheme = localStorage.getItem('theme');
    const customColor = localStorage.getItem('mainColor');
    
    // Function to set styles when toggling dark mode
    function setDarkModeStyles() {
        // Update .slogan .title text color to white
        document.querySelector('.slogan .title').style.color = 'white';
        
        // Update .slogan .tagline text color to white
        document.querySelector('.slogan .tagline').style.color = 'white';
        
        // Update .rounded-box background color to #2b3035
        document.querySelector('.rounded-box').style.backgroundColor = '#2b3035';
        
        // Update #noRouteFound text color to white
        const noRouteFound = document.getElementById('noRouteFound');
        if (noRouteFound) {
            noRouteFound.style.color = 'white !important';
        }
        
        // Update #sidebar background color to white
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.style.backgroundColor = 'white !important';
        }
    }
    
    // Function to reset styles to default when toggling back from dark mode
    function resetStyles() {
        // Reset .slogan .title text color
        document.querySelector('.slogan .title').style.color = ''; // Reset to default (if defined in CSS)
        
        // Reset .slogan .tagline text color
        document.querySelector('.slogan .tagline').style.color = ''; // Reset to default (if defined in CSS)
        
        // Reset .rounded-box background color
        document.querySelector('.rounded-box').style.backgroundColor = ''; // Reset to default (if defined in CSS)
        
        // Reset #noRouteFound text color
        const noRouteFound = document.getElementById('noRouteFound');
        if (noRouteFound) {
            noRouteFound.style.color = ''; // Reset to default (if defined in CSS)
        }
        
        // Reset #sidebar background color
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.style.backgroundColor = ''; // Reset to default (if defined in CSS)
        }
    }

    // Checking current theme and applying stored settings
    if (currentTheme) {
        if (currentTheme === 'dark') {
            document.body.classList.add('dark-mode');
            document.querySelector('header').classList.add('dark-mode');
            document.querySelector('footer').classList.add('dark-mode');
            document.querySelector('main').classList.add('dark-mode');
            toggleSwitch.checked = true;
            setDarkModeStyles(); // Apply dark mode specific styles
        }
    }

    // Event listener for toggling dark mode
    toggleSwitch.addEventListener('change', function() {
        if (this.checked) {
            document.body.classList.add('dark-mode');
            document.querySelector('header').classList.add('dark-mode');
            document.querySelector('footer').classList.add('dark-mode');
            document.querySelector('main').classList.add('dark-mode');
            setDarkModeStyles(); // Apply dark mode specific styles
            localStorage.setItem('theme', 'dark');
        } else {
            document.body.classList.remove('dark-mode');
            document.querySelector('header').classList.remove('dark-mode');
            document.querySelector('footer').classList.remove('dark-mode');
            document.querySelector('main').classList.remove('dark-mode');
            resetStyles(); // Reset styles to default
            localStorage.setItem('theme', 'light');
        }
    });

    // Event listener for changing main color
    colorPicker.addEventListener('input', function() {
        document.querySelector('main').style.backgroundColor = this.value;
        localStorage.setItem('mainColor', this.value);
    });
});
