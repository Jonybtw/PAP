async function initMap() {
  const { Map } = await google.maps.importLibrary("maps");
  const { AdvancedMarkerView } = await google.maps.importLibrary("marker");
  const { DirectionsService, DirectionsRenderer } = await google.maps.importLibrary("routes");
  const { Places } = await google.maps.importLibrary("places");

  const CenterOfPortugal = { lat: 39.4573914, lng: -8.0065354 };
  const RuaCorroios = { lat: 38.63206355815076, lng: -9.162405460490177 };

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
    this.directionsRenderer = new google.maps.DirectionsRenderer();

    this.directionsRenderer.setMap(map);
    sidebar = document.getElementById("sidebar");
    this.directionsRenderer.setPanel(sidebar);

    const originInput = document.getElementById("origin-input");
    const destinationInput = document.getElementById("destination-input");
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

    this.setupClickListener("changemode-walking",google.maps.TravelMode.WALKING,);
    this.setupClickListener("changemode-transit",google.maps.TravelMode.TRANSIT,);
    this.setupClickListener("changemode-driving",google.maps.TravelMode.DRIVING,);
    this.setupClickListener("changemode-bicycling",google.maps.TravelMode.BICYCLING,);
    this.setupPlaceChangedListener(originAutocomplete, "ORIG");
    this.setupPlaceChangedListener(destinationAutocomplete, "DEST");
    this.setupClearButtonListener("clear-directions");
    this.setupSwapButtonListener("swap-places");
  }
  // Sets a listener on a radio button to change the filter type on Places
  // Autocomplete.
  setupClickListener(id, mode) {
    const radioButton = document.getElementById(id);

    radioButton.addEventListener("click", () => {
      this.travelMode = mode;
      this.directionsRenderer.setDirections({ routes: [] });
      this.route();
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
  route() {
    if (!this.originPlaceId || !this.destinationPlaceId) {
      return;
    }

    const me = this;

    this.directionsService.route(
      {
        origin: { placeId: this.originPlaceId },
        destination: { placeId: this.destinationPlaceId },
        travelMode: this.travelMode,
      },
      (response, status) => {
        if (status === "OK") {
          me.directionsRenderer.setDirections(response);
        } else if (status === "ZERO_RESULTS") {
          window.alert("Sem resultados."); // Display a different message for ZERO_RESULTS
        } else {
          window.alert("Pedido falhou com erro: " + status);
        }
      },
    );
  }
  route() {
    if (!this.originPlaceId || !this.destinationPlaceId) {
      return;
    }

    const me = this;

    this.directionsService.route(
      {
        origin: { placeId: this.originPlaceId },
        destination: { placeId: this.destinationPlaceId },
        travelMode: this.travelMode,
      },
      (response, status) => {
        if (status === "OK") {
          me.directionsRenderer.setDirections(response);
          document.getElementById("clear-directions").style.display = "block"; // Show the clear button when there's a route
        } else if (status === "ZERO_RESULTS") {
          window.alert("Sem resultados."); // Display a different message for ZERO_RESULTS
        } else {
          window.alert("Pedido falhou com erro: " + status);
        }
      },
    );
  }
  setupClearButtonListener(id) {
    const clearButton = document.getElementById(id);

    clearButton.style.display = "none"; // Hide the clear button initially

    clearButton.addEventListener("click", () => {
      this.originPlaceId = "";
      this.destinationPlaceId = "";
      document.getElementById("origin-input").value = "";
      document.getElementById("destination-input").value = "";
      this.directionsRenderer.setDirections({ routes: [] }); // Clear directions

      clearButton.style.display = "none"; // Hide the clear button after clearing the route
    });
  }
  setupSwapButtonListener(id) {
    const swapButton = document.getElementById(id);

    swapButton.addEventListener("click", () => {
      [this.originPlaceId, this.destinationPlaceId] = [this.destinationPlaceId, this.originPlaceId];

      // Swap the values of the input fields
      var originInput = document.getElementById("origin-input");
      var destinationInput = document.getElementById("destination-input");
      [originInput.value, destinationInput.value] = [destinationInput.value, originInput.value];

      // Recalculate and display the route
      this.route();
    });
  }
}

initMap();
