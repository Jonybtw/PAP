window.addEventListener('DOMContentLoaded', function() {
    var colorInput = document.getElementById('mainColor');
    var body = document.body;

    function changeBackgroundColor() {
        var color = colorInput.value;
        body.style.setProperty('--main-color', color); // Set the value of the CSS variable
        localStorage.setItem('mainColor', color); // Store the mainColor value in localStorage
    }
    
    // Call the changeBackgroundColor function when the page loads
    window.onload = changeBackgroundColor;
});