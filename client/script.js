// Adicione esta parte ao seu script.js
window.onscroll = function () {
    // Verifica a posição do scroll
    if (document.body.scrollTop > 80 || document.documentElement.scrollTop > 80) {
      document.getElementById("navbar").classList.add("shrink");
    } else {
      document.getElementById("navbar").classList.remove("shrink");
    }
  };
  