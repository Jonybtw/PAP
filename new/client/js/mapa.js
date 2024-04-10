async function initMap() {
  const { Map } = await google.maps.importLibrary("maps");
  const { AdvancedMarkerView } = await google.maps.importLibrary("marker");
  const { DirectionsService, DirectionsRenderer } = await google.maps.importLibrary("routes");
  const { Places } = await google.maps.importLibrary("places");
  const {Geocoder} = await google.maps.importLibrary("geocoding")
  const CenterOfPortugal = { lat: 39.4573914, lng: -8.0065354 };
  const RuaCorroios = { lat: 38.63206355815076, lng: -9.162405460490177 };

  const currentDate = new Date();
  const currentDateTimeString = currentDate.toISOString().slice(0, 16);
  document.getElementById("departure-time").min = currentDateTimeString;
  document.getElementById("arrival-time").min = currentDateTimeString;

  let map;

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
}

class AutocompleteDirectionsHandler {
  map;
  originPlaceId;
  destinationPlaceId;
  travelMode;
  directionsService;
  directionsRenderer;
  constructor(map) {
    this.map = map;
    this.originPlaceId = "";
    this.destinationPlaceId = "";
    this.travelMode = google.maps.TravelMode.WALKING;
    this.directionsService = new google.maps.DirectionsService();
    this.directionsRenderer = new google.maps.DirectionsRenderer({
      draggable: false,
    });

    this.directionsRenderer.setMap(map);
    sidebar = document.getElementById("sidebar");
    this.directionsRenderer.setPanel(sidebar);
    const originInput = document.getElementById("origin-input");
    const destinationInput = document.getElementById("destination-input");
    const arrivalInput = document.getElementById("arrival-time");
    const departureInput = document.getElementById("departure-time");
    const modeSelector = document.getElementById("mode-selector");
    
    // Specify just the place data fields that you need.
    const originAutocomplete = new google.maps.places.Autocomplete(
      originInput,
      { fields: ["place_id"] },
    );
    // Specify just the place data fields that you need.
    const destinationAutocomplete = new google.maps.places.Autocomplete(
      destinationInput,
      { fields: ["place_id"] },
    );

    this.setupClickListener("changemode-walking", google.maps.TravelMode.WALKING);
    this.setupClickListener("changemode-transit", google.maps.TravelMode.TRANSIT);
    this.setupClickListener("changemode-driving", google.maps.TravelMode.DRIVING);
    this.setupClickListener("changemode-bicycling", google.maps.TravelMode.BICYCLING);
    this.setupPlaceChangedListener(originAutocomplete, "ORIG");
    this.setupPlaceChangedListener(destinationAutocomplete, "DEST");
    this.setupClearButtonListener("clear-directions");
    this.setupSwapButtonListener("swap-places");
  }

  // Sets a listener on a radio button to change the filter type on Places
  // Autocomplete.
  setupClickListener(id, mode) {
    const radioButton = document.getElementById(id);
    const arrivalInput = document.getElementById("arrival-time");
    const departureInput = document.getElementById("departure-time");

    radioButton.addEventListener("click", () => {
      this.travelMode = mode;
      this.directionsRenderer.setDirections({ routes: [] });
      this.route();

      if (mode === google.maps.TravelMode.DRIVING) {
        departureInput.style.display = "block"; // Show departure time for driving mode
        arrivalInput.style.display = "none";  // Hide arrival time
        arrivalInput.value = ""; // Clear arrival time value
      } else if (mode === google.maps.TravelMode.TRANSIT) {
        arrivalInput.style.display = "block";
        departureInput.style.display = "block";
      } else {
        arrivalInput.style.display = "none";
        departureInput.style.display = "none";
        arrivalInput.value = ""; // Clear values when hiding
        departureInput.value = "";
      }
    });
  }

  getDepartureTime() {
    const departureInput = document.getElementById("departure-time");
    departureInput.addEventListener('input', () => {
      this.route(); // Update route on input change
      document.getElementById("arrival-time").value = ""; // Clear arrival time
    });
    if (departureInput.value) {
      return new Date(departureInput.value);
    }
    return null;
  }

  getArrivalTime() {
    const arrivalInput = document.getElementById("arrival-time");
    arrivalInput.addEventListener('input', () => {
      this.route(); // Update route on input change
      document.getElementById("departure-time").value = ""; // Clear departure time
    });
    if (arrivalInput.value) {
      return new Date(arrivalInput.value);
    }
    return null;
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
      const arrivalInput = document.getElementById("arrival-time");
      const departureInput = document.getElementById("departure-time");
      document.getElementById("arrival-time").value = "";
      document.getElementById("departure-time").value = "";
      this.directionsRenderer.setDirections({ routes: [] }); // Clear directions
      clearButton.style.display = "none"; // Hide the clear button after clearing the route
    });
  }

  setupSwapButtonListener(id) {
    const swapButton = document.getElementById(id);

    swapButton.addEventListener("click", () => {
      [this.originPlaceId, this.destinationPlaceId] = [this.destinationPlaceId, this.originPlaceId]; // Swap the values of the input fields
      var originInput = document.getElementById("origin-input");
      var destinationInput = document.getElementById("destination-input");
      [originInput.value, destinationInput.value] = [destinationInput.value, originInput.value]; // Recalculate and display the route
      this.route();
    });
  }

  route() {
    if (!this.originPlaceId || !this.destinationPlaceId) {
      return;
    }
    const me = this;

    // Define drivingOptions object
    const drivingOptions = {};
    drivingOptions.departureTime = this.getDepartureTime();

    // Set traffic model (choose one)
     drivingOptions.trafficModel = google.maps.TrafficModel.BEST_GUESS;
     console.log(drivingOptions);
    // drivingOptions.trafficModel = google.maps.TrafficModel.OPTIMISTIC;
    // drivingOptions.trafficModel = google.maps.TrafficModel.PESSIMISTIC;

    this.directionsService.route(
      {
        origin: { placeId: this.originPlaceId },
        destination: { placeId: this.destinationPlaceId },
        travelMode: this.travelMode,
        drivingOptions: drivingOptions, // Include drivingOptions
        provideRouteAlternatives: true,
      },
      (response, status) => {
        if (status === "OK") {
          me.directionsRenderer.setDirections(response);
          console.log(response);
          document.getElementById("clear-directions").style.display = "block"; // Show the clear button when there's a route
        } else if (status === "ZERO_RESULTS") {
          window.alert("Sem resultados."); // Display a different message for ZERO_RESULTS
        } else {
          window.alert("Pedido falhou com erro: " + status);
        }
      },
    );
  }
}

initMap();