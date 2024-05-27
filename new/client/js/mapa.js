var map;

async function initMap() {
  const { AdvancedMarkerView } = await google.maps.importLibrary("marker");
  const { DirectionsService, DirectionsRenderer, TrafficModel, TransitMode, TransitRoutePreference } = await google.maps.importLibrary("routes");
  const { Places } = await google.maps.importLibrary("places");
  const CenterOfPortugal = { lat: 39.4573914, lng: -8.0065354 };
  const RuaCorroios = { lat: 38.63206355815076, lng: -9.162405460490177 };

  let sidebar;
  const currentDate = new Date();
  const currentDateTimeString = currentDate.toISOString().slice(0, 16);

  document.getElementById("departure-time").min = currentDateTimeString;
  document.getElementById("arrival-time").min = currentDateTimeString;

  map = new google.maps.Map(document.getElementById("map"), {
    zoom: 7,
    center: CenterOfPortugal,
    mapId: "667759e759cedcf9",
    options: {
      gestureHandling: "greedy",
      fullscreenControl: false,
    },
    mapTypeControl: true,
  });

  new AutocompleteDirectionsHandler(map);

    const xhr = new XMLHttpRequest();
  
    xhr.onload = function () {
      if (this.status === 200) {
        try {
          const fetchedRoutes = JSON.parse(this.responseText);
          const div = document.getElementById('routeList');
          fetchedRoutes.forEach(async route => {
            let start = await geocodePlaceId(geocoder, route.Start);
            let end = await geocodePlaceId(geocoder, route.End);
            //console.log(start.geometry.location, end.geometry.location);
            div.innerHTML += '<li id="">' +
                                '<div class="route">' +
                                  `<p>Início: ${start.formatted_address}</p>` +
                                  `<p>Fim: ${end.formatted_address}</p>` +
                                '</div>' +
                              '</li>';
          });
        } catch (error) {
          console.error('Error parsing fetched routes:', error);
        }
      } else {
        console.error('Failed to fetch routes:', this.statusText);
      }
    };
  
    xhr.onerror = function () {
      console.error('Network error while fetching routes');
    };
  
    // Replace with the correct server endpoint for fetching routes (ensure proper CORS configuration)
    xhr.open('GET', 'http://127.0.0.1:420/routes'); // Replace with your actual URL
    xhr.setRequestHeader('Authorization', getCookie('token')); // Assuming token-based auth
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.send();
  
 
}

const { Map } = await google.maps.importLibrary("maps");
const { Geocoder } = await google.maps.importLibrary("geocoding");
const geocoder = new google.maps.Geocoder();
async function geocodePlaceId(geocoder, placeId) {
  let result = {};

  await geocoder
    .geocode({ placeId: placeId })
    .then(({ results }) => {
      result = results[0];
    })
    .catch((e) => alert("Geocode was not successful for the following reason: " + e));
  return result;
}

class AutocompleteDirectionsHandler {
  map;
  originPlaceId;
  destinationPlaceId;
  travelMode;
  directionsService;
  directionsRenderer;
  //trafficLayer;
  constructor(map) {
    this.map = map;
    this.originPlaceId = "";
    this.destinationPlaceId = "";
    this.travelMode = google.maps.TravelMode.WALKING;
    this.directionsService = new google.maps.DirectionsService();
    this.directionsRenderer = new google.maps.DirectionsRenderer();
    this.unitSystem = null; // Default to metric
    //this.trafficLayer = new google.maps.TrafficLayer();

    this.directionsRenderer.setMap(map);
    sidebar = document.getElementById("sidebar");
    this.directionsRenderer.setPanel(sidebar);

    const originInput = document.getElementById("origin-input");
    const destinationInput = document.getElementById("destination-input");

    // Specify just the place data fields that you need.
    const originAutocomplete = new google.maps.places.Autocomplete(originInput, { fields: ["place_id"] });
    const destinationAutocomplete = new google.maps.places.Autocomplete(destinationInput, { fields: ["place_id"] });

    this.setupClickListener("changemode-walking", google.maps.TravelMode.WALKING);
    this.setupClickListener("changemode-transit", google.maps.TravelMode.TRANSIT);
    this.setupClickListener("changemode-driving", google.maps.TravelMode.DRIVING);
    this.setupClickListener("changemode-bicycling", google.maps.TravelMode.BICYCLING);
    this.setupPlaceChangedListener(originAutocomplete, "ORIG");
    this.setupPlaceChangedListener(destinationAutocomplete, "DEST");
    this.setupClearButtonListener("clear-directions");
    this.setupSwapButtonListener("swap-places");

    document.querySelectorAll('#unit-system input[type="radio"]').forEach(radio => {
      radio.addEventListener('change', () => {
        if (radio.checked) {
          this.unitSystem = google.maps.UnitSystem[radio.value];
          this.route();
        }
      });
    });

    this.getAvoidOptions = this.getAvoidOptions();
    document.querySelectorAll('#avoid-options input[type="checkbox"]').forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        this.route();
      });
    });

    
  }

  setupClickListener(id, mode) {
    const radioButton = document.getElementById(id);
    const arrivalInput = document.getElementById("arrival-time");
    const departureInput = document.getElementById("departure-time");
    const transit_options = document.getElementById("transit-options");
    const unitSystemRadios = document.querySelectorAll('#unit-system input[type="radio"]');

    // Get references to the H4 elements
    const arrivalH4 = arrivalInput.previousElementSibling;
    const departureH4 = departureInput.previousElementSibling;


    radioButton.addEventListener("click", () => {
      this.travelMode = mode;
      this.directionsRenderer.setDirections({ routes: [] });
      this.route();

      const avoidOptionsDiv = document.getElementById("avoid-options");
      if (mode === google.maps.TravelMode.DRIVING) {
        avoidOptionsDiv.style.display = "block";
        document.getElementById("avoid-highways").style.display = "block";
        document.getElementById("avoid-tolls").style.display = "block";
        document.getElementById("avoid-ferries").style.display = "block";
        //trafficLayer.setMap(map);
      } else if (mode === google.maps.TravelMode.WALKING || mode === google.maps.TravelMode.BICYCLING) {
        avoidOptionsDiv.style.display = "block";
        document.getElementById("avoid-highways").style.display = "none"; // Hide highways for walking/bicycling
        document.getElementById("avoid-tolls").style.display = "none";   // Hide tolls for walking/bicycling
        document.getElementById("avoid-ferries").style.display = "block";
        //trafficLayer.setMap(null);
      } else {
        avoidOptionsDiv.style.display = "none";
        document.getElementById("avoid-highways").style.display = "none";
        document.getElementById("avoid-tolls").style.display = "none";
        document.getElementById("avoid-ferries").style.display = "none";
        //trafficLayer.setMap(null);
      }

      if (mode === google.maps.TravelMode.DRIVING) {
        departureInput.style.display = "block";
        departureH4.style.display = "block"; // Show H4 for departure
        arrivalInput.style.display = "none";
        arrivalH4.style.display = "none"; // Hide H4 for arrival
        arrivalInput.value = "";
        transit_options.style.display = "none";
        document.getElementById("unit-system").style.display = "block";
      } else if (mode === google.maps.TravelMode.TRANSIT) {
        arrivalInput.style.display = "block";
        arrivalH4.style.display = "block"; // Show H4 for arrival
        departureInput.style.display = "block";
        departureH4.style.display = "block"; // Show H4 for departure
        transit_options.style.display = "block";
        document.getElementById("unit-system").style.display = "none";
        unitSystemRadios.forEach(radio => {
          radio.checked = false;
        });
      } else {
        arrivalInput.style.display = "none";
        arrivalH4.style.display = "none"; // Hide H4 for arrival
        departureInput.style.display = "none";
        departureH4.style.display = "none"; // Hide H4 for departure
        arrivalInput.value = "";
        departureInput.value = "";
        transit_options.style.display = "none";
        document.getElementById("unit-system").style.display = "block";
      }
    });
  }

  getDepartureTime() {
    const departureInput = document.getElementById("departure-time");
    departureInput.addEventListener('change', () => {
      const currentTime = new Date();
      const selectedTime = new Date(departureInput.value);
      if (selectedTime < currentTime) {
        departureInput.value = ""; // Clear input if selected time is in the past
        alert('Data introduzida do passado, volte a introduzir.')
      } else {
        this.route(); // Update route on input change
        document.getElementById("arrival-time").value = ""; // Clear arrival time
      }
    });
    if (departureInput.value) {
      return new Date(departureInput.value);
    }
    return null;
  }

  getArrivalTime() {
    const arrivalInput = document.getElementById("arrival-time");
    arrivalInput.addEventListener('change', () => {
      const currentTime = new Date();
      const selectedTime = new Date(arrivalInput.value);
      if (selectedTime < currentTime) {
        arrivalInput.value = "";
        alert('Data introduzida do passado, volte a introduzir.') // Clear input if selected time is in the past
      } else {
        this.route(); // Update route on input change
        document.getElementById("departure-time").value = ""; // Clear departure time
      }
    });
    if (arrivalInput.value) {
      return new Date(arrivalInput.value);
    }
    return null;
  }

  getTransitOptions() {
    // Get references to the checkboxes and radio buttons
    const modeCheckboxes = document.querySelectorAll('#transit-options input[type="checkbox"]');
    const routingPreferenceRadios = document.querySelectorAll('#transit-options input[type="radio"]');

    // Add event listeners to detect changes
    modeCheckboxes.forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        this.route(); // Update the route when a checkbox changes
      });
    });

    routingPreferenceRadios.forEach(radio => {
      radio.addEventListener('change', () => {
        this.route(); // Update the route when a radio button changes
      });
    });

    // Function to collect selected options (unchanged)
    const getSelectedOptions = () => {
      const selectedModes = [];
      modeCheckboxes.forEach(checkbox => {
        if (checkbox.checked) {
          selectedModes.push(google.maps.TransitMode[checkbox.value]);
        }
      });

      let routingPreference;
      routingPreferenceRadios.forEach(radio => {
        if (radio.checked) {
          routingPreference = google.maps.TransitRoutePreference[radio.value];
        }
      });

      return {
        modes: selectedModes,
        routingPreference: routingPreference
      };
    };

    // No need to return the options directly, as they are now accessed through getSelectedOptions()
    // Instead, return a function to get the options when needed
    return getSelectedOptions;
  }

  getAvoidOptions() {
    const avoidHighwaysCheckbox = document.getElementById("avoid-highways").querySelector("input");
    const avoidTollsCheckbox = document.getElementById("avoid-tolls").querySelector("input");
    const avoidFerriesCheckbox = document.getElementById("avoid-ferries").querySelector("input");

    return () => ({
      avoidHighways: avoidHighwaysCheckbox.checked,
      avoidTolls: avoidTollsCheckbox.checked,
      avoidFerries: avoidFerriesCheckbox.checked,
    });
  }

  setupPlaceChangedListener(autocomplete, mode) {
    autocomplete.bindTo("bounds", this.map);
    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();

      if (!place.place_id) {
        window.alert("Por favor escolhe uma opção da lista.");
        return;
      }

      if (mode === "ORIG") {
        this.originPlaceId = place.place_id;
      } else {
        this.destinationPlaceId = place.place_id;
      }

      this.route();
    });
  }

  setupClearButtonListener(id) {
    const clearButton = document.getElementById(id);

    clearButton.style.display = "none"; // Hide the clear button initially

    clearButton.addEventListener("click", () => {
      this.originPlaceId = "";
      this.destinationPlaceId = "";
      document.getElementById("origin-input").value = "";
      document.getElementById("destination-input").value = "";
      document.getElementById("arrival-time").value = "";
      document.getElementById("departure-time").value = "";
      this.directionsRenderer.setDirections({ routes: [] }); // Clear directions
      clearButton.style.display = "none"; // Hide the clear button after clearing the route
    });
  }

  setupSwapButtonListener(id) {
    const swapButton = document.getElementById(id);

    swapButton.addEventListener("click", () => {
      [this.originPlaceId, this.destinationPlaceId] = [this.destinationPlaceId, this.originPlaceId]; // Swap the values

      // Swap the values of the input fields
      var originInput = document.getElementById("origin-input");
      var destinationInput = document.getElementById("destination-input");
      [originInput.value, destinationInput.value] = [destinationInput.value, originInput.value];

      // Recalculate and display the route
      this.route();
    });
  }

  route() {
    if (!this.originPlaceId || !this.destinationPlaceId) {
      return;
    }

    const me = this;
    const request = {
      origin: { placeId: this.originPlaceId },
      destination: { placeId: this.destinationPlaceId },
      travelMode: this.travelMode,
      provideRouteAlternatives: true,
      unitSystem: this.unitSystem, // Add the unitSystem property to the request
    };

    // Only include transit options if transit mode is selected
    if (this.travelMode === google.maps.TravelMode.TRANSIT) {
      request.transitOptions = {
        arrivalTime: this.getArrivalTime(),
        departureTime: this.getDepartureTime(),
        ...this.getTransitOptions()(),
      };
      request.unitSystem = google.maps.UnitSystem.METRIC;
    }

    // Only include driving options if driving mode is selected AND departure time is set
    if (this.travelMode === google.maps.TravelMode.DRIVING && this.getDepartureTime()) {
      request.avoidHighways = this.getAvoidOptions().avoidHighways;
      request.avoidTolls = this.getAvoidOptions().avoidTolls;
      request.avoidFerries = this.getAvoidOptions().avoidFerries;
      request.drivingOptions = {
        departureTime: this.getDepartureTime(), // Requires Google Maps Platform Premium Plan
      };
    }

    if (this.travelMode === google.maps.TravelMode.DRIVING) {
      request.avoidHighways = this.getAvoidOptions().avoidHighways;
      request.avoidTolls = this.getAvoidOptions().avoidTolls;
      request.avoidFerries = this.getAvoidOptions().avoidFerries;
    }

    else if (this.travelMode === google.maps.TravelMode.WALKING || this.travelMode === google.maps.TravelMode.BICYCLING) {
      request.avoidFerries = this.getAvoidOptions().avoidFerries; // Only apply ferries for walking/bicycling
    }

    document.getElementById("save").addEventListener("click", () => {

      const xhr = new XMLHttpRequest();
      const url = 'http://127.0.0.1:420/routes'; // Replace with your Node.js server address
      const data = JSON.stringify(request);
      xhr.open('POST', url, true);
      xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
      xhr.setRequestHeader('Authorization', getCookie('token'));
      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
          console.log(xhr.responseText);
        }
      };
      xhr.send(data);
    });

    this.directionsService.route(request, (response, status) => {
      if (status === "OK") {
      me.directionsRenderer.setDirections(response);
      document.getElementById("clear-directions").style.display = "block"; // Show the clear button when there's a route
      } else if (status === "ZERO_RESULTS") {
      window.alert("Sem resultados."); // Display a different message for ZERO_RESULTS
      } else if (status === "MAX_ROUTE_LENGTH_EXCEEDED") {
      window.alert("A rota excede o comprimento máximo permitido."); // Display a message for MAX_ROUTE_LENGTH_EXCEEDED
      } else {
      window.alert("Pedido falhou com erro: " + status);
      }
    });
  }
}

initMap();