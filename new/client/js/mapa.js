var map;
var autocompleteDirectionsHandler;

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
    .catch((e) =>
      alert("Geocode was not successful for the following reason: " + e)
    );
  return result;
}

async function fetchAndDisplayRoutes() {
  const div = document.getElementById("routeList");

  div.innerHTML = "";

  try {
    const fetchedRoutes = await fetchRoutesFromServer();
    //
    for (const route of fetchedRoutes) {
      const start = await geocodePlaceId(geocoder, route.Start);
      const end = await geocodePlaceId(geocoder, route.End);

      const listItem = document.createElement("li");
      listItem.id = route._id;

      const routeDiv = document.createElement("div");
      routeDiv.classList.add("route");
      routeDiv.innerHTML = `
        <p><b>Início:</b> <input type="text" value="${start.formatted_address}" data-field="Start" data-place-id="${route.Start}" id="start_${route._id}"></p>
        <p><b>Fim:</b> <input type="text" value="${end.formatted_address}" data-field="End" data-place-id="${route.End}" id="end_${route._id}"></p>
      `;

      // Add update button to the routeDiv
      const updateButton = document.createElement("button");
      updateButton.textContent = "Atualizar";
      updateButton.classList.add("update");
      updateButton.addEventListener("click", () =>
        handleUpdateRoute(route._id, routeDiv)
      );
      routeDiv.appendChild(updateButton);

      // Add delete button to the routeDiv
      const deleteButton = document.createElement("button");
      deleteButton.textContent = "Apagar";
      deleteButton.classList.add("delete");
      deleteButton.addEventListener("click", () =>
        handleDeleteRoute(route._id)
      );
      routeDiv.appendChild(deleteButton);

      div.appendChild(listItem);
      listItem.appendChild(routeDiv);

      // Initialize Autocomplete for Start input
      const startInput = document.getElementById(`start_${route._id}`);
      if (!startInput.autocomplete) {
        const startAutocomplete = new google.maps.places.Autocomplete(
          startInput,
          {
            fields: ["place_id", "geometry", "formatted_address", "name"],
          }
        );

        // Listen for place_changed to store Place ID and update input data attribute
        startAutocomplete.addListener("place_changed", () => {
          const place = startAutocomplete.getPlace();
          if (place.place_id) {
            startInput.dataset.placeId = place.place_id;
            startInput.value = place.formatted_address; // Update displayed address in input
          }
        });
        startInput.autocomplete = startAutocomplete;
      }

      // Initialize Autocomplete for End input (same as Start input)
      const endInput = document.getElementById(`end_${route._id}`);
      if (!endInput.autocomplete) {
        const endAutocomplete = new google.maps.places.Autocomplete(endInput, {
          fields: ["place_id", "geometry", "formatted_address", "name"],
        });

        endAutocomplete.addListener("place_changed", () => {
          const place = endAutocomplete.getPlace();
          if (place.place_id) {
            endInput.dataset.placeId = place.place_id;
            endInput.value = place.formatted_address; // Update displayed address in input
          }
        });
        endInput.autocomplete = endAutocomplete;
      }
      // Updated click event listener:
      routeDiv.addEventListener("click", () => {
        autocompleteDirectionsHandler.originPlaceId = "";
        autocompleteDirectionsHandler.destinationPlaceId = "";
        autocompleteDirectionsHandler.directionsRenderer.setDirections({
          routes: [],
        });

        // Set the origin and destination from the route data
        const originInput = document.getElementById("origin-input");
        const destinationInput = document.getElementById("destination-input");
        originInput.value = start.formatted_address; // Set the values in the input fields
        destinationInput.value = end.formatted_address;
        autocompleteDirectionsHandler.originPlaceId = route.Start;
        autocompleteDirectionsHandler.destinationPlaceId = route.End;
        autocompleteDirectionsHandler.route();
      });
    }
  } catch (error) {
    console.error("Error fetching or displaying routes:", error);
    // Handle errors (e.g., display an error message to the user)
  }
}

function filterRoutes() {
  const searchTerm = normalizeString(
    document.getElementById("searchBox").value.toLowerCase()
  );
  const routeListItems = document.querySelectorAll("#routeList li");

  routeListItems.forEach((item) => {
    const routeDiv = item.querySelector(".route");
    const startAddress = normalizeString(
      routeDiv.querySelector('input[data-field="Start"]').value.toLowerCase()
    );
    const endAddress = normalizeString(
      routeDiv.querySelector('input[data-field="End"]').value.toLowerCase()
    );

    const isMatch =
      startAddress.includes(searchTerm) || endAddress.includes(searchTerm);
    item.style.display = isMatch ? "" : "none";
  });
}

function normalizeString(str) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
document.getElementById("searchBox").addEventListener("keyup", filterRoutes);

// Function to fetch routes from server (replace with your actual implementation)
async function fetchRoutesFromServer() {
  const response = await fetch("http://127.0.0.1:420/routes", {
    headers: { Authorization: getCookie("token") },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch routes: ${response.statusText}`);
  }
  return response.json();
}

// Function to handle deleting a route
async function handleDeleteRoute(routeId) {
  try {
    const response = await fetch(`http://127.0.0.1:420/routes/${routeId}`, {
      method: "DELETE",
      headers: { Authorization: getCookie("token") },
    });

    if (response.ok) {
      // Route deleted successfully, update the displayed list
      fetchAndDisplayRoutes();
    } else {
      console.error(`Failed to delete route: ${response.statusText}`);
      // Handle deletion error
    }
  } catch (error) {
    console.error("Error deleting route:", error);
    // Handle network or other errors
  }
}

async function handleUpdateRoute(routeId, routeDiv) {
  try {
    // Get input elements for start and end
    const startInput = routeDiv.querySelector('input[data-field="Start"]');
    const endInput = routeDiv.querySelector('input[data-field="End"]');

    // Check if input elements exist
    if (!startInput || !endInput) {
      console.error("Start or End input not found");
      return;
    }

    // Get Place IDs directly from the input data attributes
    const startPlaceId = startInput.dataset.placeId;
    const endPlaceId = endInput.dataset.placeId;

    // Check if Place IDs are valid (if not they haven't changed the fields)
    if (!startPlaceId || !endPlaceId) {
      alert("Please select valid places from the dropdown lists.");
      return;
    }

    // Prepare data for the update request
    const updatedData = {
      Start: startPlaceId,
      End: endPlaceId,
    };

    // Send the update request
    const response = await fetch(`http://127.0.0.1:420/routes/${routeId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: getCookie("token"),
      },
      body: new URLSearchParams(updatedData).toString(),
    });

    if (response.ok) {
      // Refresh the route list upon successful update
      fetchAndDisplayRoutes();
    } else {
      console.error(`Failed to update route: ${response.statusText}`);
      // Handle the error (e.g., display an error message to the user)
    }
  } catch (error) {
    console.error("Error updating route:", error);
    // Handle other potential errors
  }
}

fetchAndDisplayRoutes(); // Initial fetch and display

async function initMap() {
  const { AdvancedMarkerView } = await google.maps.importLibrary("marker");
  const {
    DirectionsService,
    DirectionsRenderer,
    TrafficModel,
    TransitMode,
    TransitRoutePreference,
  } = await google.maps.importLibrary("routes");
  const { Places } = await google.maps.importLibrary("places");
  const CenterOfPortugal = { lat: 39.4573914, lng: -8.0065354 };

  let sidebar;
  const currentDate = new Date();
  const currentDateTimeString = currentDate.toISOString().slice(0, 16);

  document.getElementById("departure-time").min = currentDateTimeString;
  document.getElementById("arrival-time").min = currentDateTimeString;

  map = new google.maps.Map(document.getElementById("map"), {
    zoom: 7,
    mapId: "667759e759cedcf9",
    options: {
      gestureHandling: "greedy",
      fullscreenControl: false,
    },
    mapTypeControl: true,
  });

  autocompleteDirectionsHandler = new AutocompleteDirectionsHandler(map);

  let userLocationData = null; // Store coordinates, place ID, and formatted address

  async function getUserLocation() {
    try {
      if (navigator.geolocation) {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        const userLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        const geocodeResult = await new Promise((resolve, reject) => {
          geocoder.geocode({ location: userLocation }, (results, status) => {
            if (status === "OK" && results[0]) {
              resolve(results[0]);
            } else {
              reject(new Error("Geocoding failed: " + status));
            }
          });
        });

        return {
          coordinates: userLocation,
          placeId: geocodeResult.place_id,
          formatted_address: geocodeResult.formatted_address, // Include formatted address
        };
      } else {
        throw new Error("Geolocation is not supported by this browser.");
      }
    } catch (error) {
      if (error.code === error.PERMISSION_DENIED) {
        console.log("User denied geolocation permission.");
      } else {
        console.error("Error getting user location:", error);
      }
      throw error; // Re-throw the error to be handled by the calling function
    }
  }

  async function getLocationFromIP() {
    const response = await fetch(
      "https://api.ipgeolocation.io/ipgeo?apiKey=2ae8ce43c0bd4ef5bbb89bd3678eea6f"
    );
    const data = await response.json();
    const userCountry = data.country_name;

    const geocoderResult = await geocoder.geocode({ address: userCountry });
    return geocoderResult.results[0].geometry.location;
  }

  function centerMap(location) {
    map.setCenter(location);
  }

  async function centerMapToAvailableLocation() {
    try {
      if (!userLocationData) {
        userLocationData = await getUserLocation();
      }

      if (userLocationData.coordinates) {
        centerMap(userLocationData.coordinates);
      } else {
        const ipLocation = await getLocationFromIP();
        centerMap(ipLocation);
      }
    } catch (error) {
      if (error.message === "User denied geolocation prompt") {
        console.log("Using IP-based location...");
        const ipLocation = await getLocationFromIP();
        centerMap(ipLocation);
      } else {
        // Handle other errors (e.g., permission denied, geocoding failed)
        alert("Error getting location: " + error.message);
      }
    }
  }

  centerMapToAvailableLocation();

  document.getElementById("use-my-location-button").addEventListener("click", () => {
    if (userLocationData && userLocationData.placeId) {
      const originInput = document.getElementById("origin-input");
      originInput.value = userLocationData.formatted_address;
      autocompleteDirectionsHandler.originPlaceId = userLocationData.placeId;
      autocompleteDirectionsHandler.route();
    } else {
      // If no location data or Place ID, show error message
      alert("Please refresh the page and allow geolocation.");
    }
  });

  let clickCount = 0;
let origin = null;
let destination = null;
let markerOrigin = null; // Variable to store the origin marker
let markerDestination = null; // Variable to store the destination marker

map.addListener("click", async (event) => {
  clickCount++;

  if (clickCount === 1) {
    origin = event.latLng;

    // Remove previous origin marker if it exists
    if (markerOrigin) {
      markerOrigin.setMap(null);
    }

    // Add new origin marker
    markerOrigin = new google.maps.Marker({
      position: origin,
      map: map,
      title: "Origin",
    });
  } else if (clickCount === 2) {
    destination = event.latLng;
    clickCount = 0; // Reset click count

    // Remove previous destination marker if it exists
    if (markerDestination) {
      markerDestination.setMap(null);
    }

    // Add new destination marker
    markerDestination = new google.maps.Marker({
      position: destination,
      map: map,
      title: "Destination",
    });

    try {
      const [originResult, destinationResult] = await Promise.all([
        geocoder.geocode({ location: origin }),
        geocoder.geocode({ location: destination }),
      ]);

      if (
        originResult.results.length === 0 ||
        destinationResult.results.length === 0
      ) {
        throw new Error("Geocoding failed to find a valid address.");
      }

      const originPlaceId = originResult.results[0].place_id;
      const originFormattedAddress = originResult.results[0].formatted_address; // Get formatted address
      const destinationPlaceId = destinationResult.results[0].place_id;
      const destinationFormattedAddress = destinationResult.results[0].formatted_address; // Get formatted address

      // Set origin and destination for the route
      autocompleteDirectionsHandler.originPlaceId = originPlaceId;
      autocompleteDirectionsHandler.destinationPlaceId = destinationPlaceId;
      autocompleteDirectionsHandler.route();

      // Fill text boxes with formatted addresses
      document.getElementById("origin-input").value = originFormattedAddress;
      document.getElementById("destination-input").value = destinationFormattedAddress;

      // Remove markers after route calculation
      markerOrigin.setMap(null);
      markerDestination.setMap(null);

      // Reset origin and destination for next route
      origin = null;
      destination = null;
      markerOrigin = null;
      markerDestination = null;

    } catch (error) {
      alert("Error finding origin or destination: " + error.message);
    }
  }
});


}

class AutocompleteDirectionsHandler {
  map;
  originPlaceId;
  destinationPlaceId;
  travelMode;
  directionsService;
  directionsRenderer;
  fetchAndDisplayRoutes;
  //trafficLayer;
  constructor(map) {
    this.map = map;
    this.originPlaceId = "";
    this.destinationPlaceId = "";
    this.travelMode = google.maps.TravelMode.WALKING;
    this.directionsService = new google.maps.DirectionsService();
    this.directionsRenderer = new google.maps.DirectionsRenderer();
    this.unitSystem = null; // Default to metric
    this.fetchAndDisplayRoutes = fetchAndDisplayRoutes;
    //this.trafficLayer = new google.maps.TrafficLayer();

    this.directionsRenderer.setMap(map);
    sidebar = document.getElementById("sidebar");
    this.directionsRenderer.setPanel(sidebar);

    const originInput = document.getElementById("origin-input");
    const destinationInput = document.getElementById("destination-input");

    // Specify just the place data fields that you need.
    const originAutocomplete = new google.maps.places.Autocomplete(
      originInput,
      { fields: ["place_id"] }
    );
    const destinationAutocomplete = new google.maps.places.Autocomplete(
      destinationInput,
      { fields: ["place_id"] }
    );

    this.setupClickListener(
      "changemode-walking",
      google.maps.TravelMode.WALKING
    );
    this.setupClickListener(
      "changemode-transit",
      google.maps.TravelMode.TRANSIT
    );
    this.setupClickListener(
      "changemode-driving",
      google.maps.TravelMode.DRIVING
    );
    this.setupClickListener(
      "changemode-bicycling",
      google.maps.TravelMode.BICYCLING
    );
    this.setupPlaceChangedListener(originAutocomplete, "ORIG");
    this.setupPlaceChangedListener(destinationAutocomplete, "DEST");
    this.setupClearButtonListener("clear-directions");
    this.setupSwapButtonListener("swap-places");

    document
      .querySelectorAll('#unit-system input[type="radio"]')
      .forEach((radio) => {
        radio.addEventListener("change", () => {
          if (radio.checked) {
            this.unitSystem = google.maps.UnitSystem[radio.value];
            this.route();
          }
        });
      });

    this.getAvoidOptions = this.getAvoidOptions();
    document
      .querySelectorAll('#avoid-options input[type="checkbox"]')
      .forEach((checkbox) => {
        checkbox.addEventListener("change", () => {
          this.route();
        });
      });
  }

  setupClickListener(id, mode) {
    const radioButton = document.getElementById(id);
    const arrivalInput = document.getElementById("arrival-time");
    const departureInput = document.getElementById("departure-time");
    const transit_options = document.getElementById("transit-options");
    const unitSystemRadios = document.querySelectorAll(
      '#unit-system input[type="radio"]'
    );

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
      } else if (
        mode === google.maps.TravelMode.WALKING ||
        mode === google.maps.TravelMode.BICYCLING
      ) {
        avoidOptionsDiv.style.display = "block";
        document.getElementById("avoid-highways").style.display = "none"; // Hide highways for walking/bicycling
        document.getElementById("avoid-tolls").style.display = "none"; // Hide tolls for walking/bicycling
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
        unitSystemRadios.forEach((radio) => {
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
    departureInput.addEventListener("change", () => {
      const currentTime = new Date();
      const selectedTime = new Date(departureInput.value);
      if (selectedTime < currentTime) {
        departureInput.value = ""; // Clear input if selected time is in the past
        alert("Data introduzida do passado, volte a introduzir.");
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
    arrivalInput.addEventListener("change", () => {
      const currentTime = new Date();
      const selectedTime = new Date(arrivalInput.value);
      if (selectedTime < currentTime) {
        arrivalInput.value = "";
        alert("Data introduzida do passado, volte a introduzir."); // Clear input if selected time is in the past
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
    const modeCheckboxes = document.querySelectorAll(
      '#transit-options input[type="checkbox"]'
    );
    const routingPreferenceRadios = document.querySelectorAll(
      '#transit-options input[type="radio"]'
    );

    // Add event listeners to detect changes
    modeCheckboxes.forEach((checkbox) => {
      checkbox.addEventListener("change", () => {
        this.route(); // Update the route when a checkbox changes
      });
    });

    routingPreferenceRadios.forEach((radio) => {
      radio.addEventListener("change", () => {
        this.route(); // Update the route when a radio button changes
      });
    });

    // Function to collect selected options (unchanged)
    const getSelectedOptions = () => {
      const selectedModes = [];
      modeCheckboxes.forEach((checkbox) => {
        if (checkbox.checked) {
          selectedModes.push(google.maps.TransitMode[checkbox.value]);
        }
      });

      let routingPreference;
      routingPreferenceRadios.forEach((radio) => {
        if (radio.checked) {
          routingPreference = google.maps.TransitRoutePreference[radio.value];
        }
      });

      return {
        modes: selectedModes,
        routingPreference: routingPreference,
      };
    };

    // No need to return the options directly, as they are now accessed through getSelectedOptions()
    // Instead, return a function to get the options when needed
    return getSelectedOptions;
  }

  getAvoidOptions() {
    const avoidHighwaysCheckbox = document
      .getElementById("avoid-highways")
      .querySelector("input");
    const avoidTollsCheckbox = document
      .getElementById("avoid-tolls")
      .querySelector("input");
    const avoidFerriesCheckbox = document
      .getElementById("avoid-ferries")
      .querySelector("input");

    return () => ({
      avoidHighways: avoidHighwaysCheckbox.checked,
      avoidTolls: avoidTollsCheckbox.checked,
      avoidFerries: avoidFerriesCheckbox.checked,
    });
  }

  setupPlaceChangedListener(autocomplete, mode) {
    autocomplete.bindTo("bounds", this.map);

    // Remove existing 'place_changed' listeners
    google.maps.event.clearListeners(autocomplete, "place_changed");

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();

      if (!place.place_id) {
        window.alert("Please choose an option from the list.");
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
    const saveButton = document.getElementById("save");

    clearButton.addEventListener("click", () => {
      this.originPlaceId = "";
      this.destinationPlaceId = "";
      document.getElementById("origin-input").value = "";
      document.getElementById("destination-input").value = "";
      document.getElementById("arrival-time").value = "";
      document.getElementById("departure-time").value = "";
      this.directionsRenderer.setDirections({ routes: [] }); // Clear directions
      clearButton.style.display = "none"; // Hide the clear button after clearing the route
      saveButton.style.display = "none";
    });
  }

  setupSwapButtonListener(id) {
    const swapButton = document.getElementById(id);

    swapButton.addEventListener("click", () => {
      // Get input elements
      const originInput = document.getElementById("origin-input");
      const destinationInput = document.getElementById("destination-input");

      // Remove existing Autocomplete instances (if any)
      if (originInput.autocomplete) {
        google.maps.event.clearInstanceListeners(originInput.autocomplete);
        originInput.autocomplete = null;
      }
      if (destinationInput.autocomplete) {
        google.maps.event.clearInstanceListeners(destinationInput.autocomplete);
        destinationInput.autocomplete = null;
      }
      console.log("Antes: " + originInput.value, destinationInput.value);
      // Swap the values of the input fields
      [originInput.value, destinationInput.value] = [
        destinationInput.value,
        originInput.value,
      ];
      console.log("Depois: " + originInput.value, destinationInput.value);

      // Swap the place IDs
      [this.originPlaceId, this.destinationPlaceId] = [
        this.destinationPlaceId,
        this.originPlaceId,
      ];

      // Re-initialize Autocomplete for both inputs
      const originAutocomplete = new google.maps.places.Autocomplete(
        originInput,
        { fields: ["place_id"] }
      );
      const destinationAutocomplete = new google.maps.places.Autocomplete(
        destinationInput,
        { fields: ["place_id"] }
      );

      // Set up place changed listeners for the re-initialized Autocomplete instances
      this.setupPlaceChangedListener(originAutocomplete, "ORIG");
      this.setupPlaceChangedListener(destinationAutocomplete, "DEST");

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
    if (
      this.travelMode === google.maps.TravelMode.DRIVING &&
      this.getDepartureTime()
    ) {
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
    } else if (
      this.travelMode === google.maps.TravelMode.WALKING ||
      this.travelMode === google.maps.TravelMode.BICYCLING
    ) {
      request.avoidFerries = this.getAvoidOptions().avoidFerries; // Only apply ferries for walking/bicycling
    }

    document.getElementById("save").addEventListener("click", async () => {
      try {
        const response = await fetch("http://127.0.0.1:420/routes", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded", // Send as JSON
            Authorization: getCookie("token"),
          },
          body: JSON.stringify(request), // Send the entire request object
        });

        if (response.ok) {
          fetchAndDisplayRoutes();
        } else {
          console.error(`Failed to save route: ${response.statusText}`);
        }
      } catch (error) {
        console.error("Error saving route:", error);
      }
    });

    this.directionsService.route(request, (response, status) => {
      if (status === "OK") {
        me.directionsRenderer.setDirections(response);
        document.getElementById("clear-directions").style.display = "block";
        document.getElementById("save").style.display = "block";
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
