async function initMap() {
  const { Map } = await google.maps.importLibrary("maps");
  const { AdvancedMarkerView } = await google.maps.importLibrary("marker");
  const { DirectionsService, DirectionsRenderer } =
  await google.maps.importLibrary("routes");
  const { Places } = await google.maps.importLibrary("places");

  const CenterOfPortugal = { lat: 39.4573914, lng: -8.0065354 };
  const RuaCorroios = { lat: 38.63206355815076, lng: -9.162405460490177 };

  let map;
  let marker;
  let infoWindow;
  var startPoint = null;

  map = new google.maps.Map(document.getElementById("map"), {
    zoom: 7,
    center: CenterOfPortugal,
    mapId: "667759e759cedcf9",
    options: {
      gestureHandling: "greedy",
    },
    mapTypeControl: false,
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
    this.setupPlaceChangedListener(originAutocomplete, "ORIG");
    this.setupPlaceChangedListener(destinationAutocomplete, "DEST");
    //this.map.controls[google.maps.ControlPosition.TOP_LEFT].push(originInput);
    //this.map.controls[google.maps.ControlPosition.TOP_LEFT].push(destinationInput,);
    //this.map.controls[google.maps.ControlPosition.TOP_LEFT].push(modeSelector);
  }
  // Sets a listener on a radio button to change the filter type on Places
  // Autocomplete.
  setupClickListener(id, mode) {
    const radioButton = document.getElementById(id);

    radioButton.addEventListener("click", () => {
      this.travelMode = mode;
      this.route();
    });
  }
  setupPlaceChangedListener(autocomplete, mode) {
    autocomplete.bindTo("bounds", this.map);
    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();

      if (!place.place_id) {
        window.alert("Please select an option from the dropdown list.");
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
          // Get distance and duration from the response
          const distance = response.routes[0].legs[0].distance.text;
          const duration = response.routes[0].legs[0].duration.text;

          // Create a div to display the distance and duration
          const div = document.createElement('div');
          div.id = 'routeInfo';
          div.innerHTML = `Distance: ${distance}, Duration: ${duration}`;
        } else {
          window.alert("Directions request failed due to " + status);
        }
      },
    );
  }
}


initMap();
