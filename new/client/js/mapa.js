var map;
var autocompleteDirectionsHandler;

const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl))

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
      alert(
        "A geocodificação não foi bem-sucedida devido à seguinte razão: " + e
      )
    );
  return result;
}

async function fetchAndDisplayRoutes() {
  const div = document.getElementById("routeList");
  div.style.padding = 0;
  div.innerHTML = "";

  try {
    const fetchedRoutes = await fetchRoutesFromServer();
    for (const route of fetchedRoutes) {
      const start = await geocodePlaceId(geocoder, route.Start);
      const end = await geocodePlaceId(geocoder, route.End);

      const listItem = document.createElement("li");
      listItem.id = route._id;

      const routeDiv = document.createElement("div");
      routeDiv.classList.add("route");
      routeDiv.innerHTML = `
        <div>
          <div class="input-group mb-3" style="gap: 5px;">
            <span class="input-group-text bg-secondary text-white" id="basic-addon1" style="min-width: 4rem;display: flex;justify-content: center;">Início</span>
            <input type="text" class="form-control" placeholder="Início" aria-label="Início" aria-describedby="basic-addon1" value="${start.formatted_address}"  data-field="Start" data-place-id="${route.Start}" id="start_${route._id}">
          </div>
          <div class="input-group mb-3" style="gap: 5px;">
            <span class="input-group-text bg-secondary text-white" id="basic-addon1" style="min-width: 4rem;dispslay: flex;justify-content: center;">Fim</span>
            <input type="text" class="form-control" placeholder="Fim" aria-label="Fim" aria-describedby="basic-addon1" value="${end.formatted_address}" data-field="End" data-place-id="${route.End}" id="end_${route._id}">
          </div>
        </div>
        <div class="btn-group" role="group" aria-label="Basic mixed styles example" id="btns">
        </div>
      `;
      let btnsGroup = routeDiv.children['btns'];
      const updateButton = document.createElement("button");
      updateButton.type = "button";
      updateButton.className = "btn btn-warning";
      updateButton.textContent = "Atualizar";
      updateButton.classList.add("update");
      updateButton.addEventListener("click", (event) => {
        event.stopPropagation();
        handleUpdateRoute(route._id, routeDiv);
      });
      btnsGroup.appendChild(updateButton);

      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "btn btn-danger delete";
      deleteButton.innerHTML = `Apagar`;
      deleteButton.addEventListener("click", (event) => {
        event.stopPropagation();
        handleDeleteRoute(route._id);
      });
      btnsGroup.appendChild(deleteButton);

      div.appendChild(listItem);
      listItem.appendChild(routeDiv);

      const startInput = document.getElementById(`start_${route._id}`);
      if (!startInput.autocomplete) {
        const startAutocomplete = new google.maps.places.Autocomplete(
          startInput,
          {
            fields: ["place_id", "geometry", "formatted_address", "name"],
          }
        );

        startAutocomplete.addListener("place_changed", () => {
          const place = startAutocomplete.getPlace();
          if (place.place_id) {
            startInput.dataset.placeId = place.place_id;
            startInput.value = place.formatted_address;
          }
        });
        startInput.autocomplete = startAutocomplete;
      }

      const endInput = document.getElementById(`end_${route._id}`);
      if (!endInput.autocomplete) {
        const endAutocomplete = new google.maps.places.Autocomplete(endInput, {
          fields: ["place_id", "geometry", "formatted_address", "name"],
        });

        endAutocomplete.addListener("place_changed", () => {
          const place = endAutocomplete.getPlace();
          if (place.place_id) {
            endInput.dataset.placeId = place.place_id;
            endInput.value = place.formatted_address;
          }
        });
        endInput.autocomplete = endAutocomplete;
      }
      const useRouteButton = document.createElement("button");
      useRouteButton.type = "button";
      useRouteButton.className = "btn btn-success";
      useRouteButton.innerHTML = `Usar esta rota`;
      useRouteButton.addEventListener("click", (event) => {
        autocompleteDirectionsHandler.originPlaceId = "";
        autocompleteDirectionsHandler.destinationPlaceId = "";
        autocompleteDirectionsHandler.directionsRenderer.setDirections({
          routes: [],
        });

        const originInput = document.getElementById("origin-input");
        const destinationInput = document.getElementById("destination-input");
        originInput.value = start.formatted_address;
        destinationInput.value = end.formatted_address;
        autocompleteDirectionsHandler.originPlaceId = route.Start;
        autocompleteDirectionsHandler.destinationPlaceId = route.End;
        autocompleteDirectionsHandler.route();
      });
      btnsGroup.appendChild(useRouteButton);
    }
  } catch (error) {
    console.error("Erro ao buscar ou exibir rotas:", error);
  }
}

function filterRoutes() {
  const searchTerm = normalizeString(
    document.getElementById("searchBox").value.toLowerCase()
  );
  const routeListItems = document.querySelectorAll("#routeList li");
  const noResultsMessage = document.getElementById("noResultsMessage");
  let hasResults = false;

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
    if (isMatch) {
      hasResults = true;
    }
  });
  noResultsMessage.style.display = hasResults ? "none" : "block";
}

function normalizeString(str) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
document.getElementById("searchBox").addEventListener("keyup", filterRoutes);

async function fetchRoutesFromServer() {
  const response = await fetch("http://127.0.0.1:420/routes", {
    headers: { Authorization: getCookie("token") },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch routes: ${response.statusText}`);
  }
  return response.json();
}

async function handleDeleteRoute(routeId) {
  try {
    const response = await fetch(`http://127.0.0.1:420/routes/${routeId}`, {
      method: "DELETE",
      headers: { Authorization: getCookie("token") },
    });

    if (response.ok) {
      fetchAndDisplayRoutes();
    } else {
      console.error(`Falha ao excluir a rota: ${response.statusText}`);
    }
  } catch (error) {
    console.error("Erro ao excluir a rota:", error);
  }
}

async function handleUpdateRoute(routeId, routeDiv) {
  try {
    const startInput = routeDiv.querySelector('input[data-field="Start"]');
    const endInput = routeDiv.querySelector('input[data-field="End"]');

    if (!startInput || !endInput) {
      console.error("Campo de início ou fim não encontrado");
      return;
    }

    const startPlaceId = startInput.dataset.placeId;
    const endPlaceId = endInput.dataset.placeId;

    if (!startPlaceId || !endPlaceId) {
      alert("Por favor, selecione lugares válidos nas listas suspensas.");
      return;
    }

    const updatedData = {
      Start: startPlaceId,
      End: endPlaceId,
    };

    const response = await fetch(`http://127.0.0.1:420/routes/${routeId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: getCookie("token"),
      },
      body: new URLSearchParams(updatedData).toString(),
    });

    if (response.ok) {
      fetchAndDisplayRoutes();
    } else {
      console.error(`Falha ao atualizar rota: ${response.statusText}`);
    }
  } catch (error) {
    console.error("Erro ao atualizar rota:", error);
  }
}

fetchAndDisplayRoutes();

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

  let sidebar;
  const currentDate = new Date();
  const currentDateTimeString = currentDate.toISOString().slice(0, 16);

  document.getElementById("origin-input").value = "";
  document.getElementById("destination-input").value = "";
  document.getElementById("departure-time").value = "";
  document.getElementById("arrival-time").value = "";

  const radioButtons = document.querySelectorAll('input[type="radio"]');
  radioButtons.forEach((radio) => (radio.checked = false));

  const checkboxes = document.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach((checkbox) => (checkbox.checked = false));

  document.getElementById("clear-directions").disabled = true;
  document.getElementById("save").disabled = true;
  document.getElementById("noRouteFound").style.display = "block";
  document.getElementById("avoid-options").style.display = "none";
  document.getElementById("transit-options").style.display = "none";
  document.getElementById("unit-system").style.display = "none";

  document.getElementById("departure-time").min = currentDateTimeString;
  document.getElementById("arrival-time").min = currentDateTimeString;

  map = new google.maps.Map(document.getElementById("map"), {
    zoom: 7,
    mapId: "667759e759cedcf9",
    options: {
      gestureHandling: "greedy",
      fullscreenControl: false,
      scaleControl: true,
    },
    mapTypeControl: true,
  });

  autocompleteDirectionsHandler = new AutocompleteDirectionsHandler(map);

  let userLocationData = null;

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
              reject(new Error("Falha na geocodificação: " + status));
            }
          });
        });

        return {
          coordinates: userLocation,
          placeId: geocodeResult.place_id,
          formatted_address: geocodeResult.formatted_address,
        };
      } else {
        throw new Error("Geolocalização não é suportada por este navegador.");
      }
    } catch (error) {
      if (error.code === error.PERMISSION_DENIED) {
        console.log("Permissão de geolocalização negada pelo utilizador.");
      } else {
        console.error("Erro ao obter a localização do utilizador:", error);
      }
      throw error;
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
        console.log("A utilizar localização baseada no IP...");
        const ipLocation = await getLocationFromIP();
        centerMap(ipLocation);
      } else {
        alert("Erro ao obter a localização: " + error.message);
      }
    }
  }

  centerMapToAvailableLocation();

  document
    .getElementById("use-my-location-button")
    .addEventListener("click", () => {
      if (userLocationData && userLocationData.placeId) {
        const originInput = document.getElementById("origin-input");
        originInput.value = userLocationData.formatted_address;
        autocompleteDirectionsHandler.originPlaceId = userLocationData.placeId;
        autocompleteDirectionsHandler.route();
      } else {
        alert("Por favor, atualize a página e permita a geolocalização.");
      }
    });

  let origin = null;
  let destination = null;

  map.addListener("click", async (event) => {
    if (
      autocompleteDirectionsHandler.originPlaceId &&
      autocompleteDirectionsHandler.destinationPlaceId
    ) {
      autocompleteDirectionsHandler.originPlaceId = null;
      autocompleteDirectionsHandler.destinationPlaceId = null;
      document.getElementById("origin-input").value = "";
      document.getElementById("destination-input").value = "";

      origin = null;
    }

    const clickedLocation = event.latLng;

    try {
      const geocodeResult = await geocoder.geocode({
        location: clickedLocation,
      });

      if (geocodeResult.results.length === 0) {
        throw new Error("A geocodificação falhou ao encontrar um endereço válido.");
      }

      const placeId = geocodeResult.results[0].place_id;
      const formattedAddress = geocodeResult.results[0].formatted_address;

      if (!autocompleteDirectionsHandler.originPlaceId) {
        origin = placeId;
        document.getElementById("origin-input").value = formattedAddress;
        autocompleteDirectionsHandler.originPlaceId = placeId;
      } else if (!autocompleteDirectionsHandler.destinationPlaceId) {
        destination = placeId;
        document.getElementById("destination-input").value = formattedAddress;
        autocompleteDirectionsHandler.destinationPlaceId = placeId;
      }
    } catch (error) {
      alert("Erro ao encontrar endereço: " + error.message);
      return;
    }

    if (
      autocompleteDirectionsHandler.originPlaceId &&
      autocompleteDirectionsHandler.destinationPlaceId
    ) {
      try {
        autocompleteDirectionsHandler.route();
        origin = null;
        destination = null;
      } catch (error) {
        alert("Erro ao calcular a rota: " + error.message);
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
  constructor(map) {
    this.map = map;
    this.originPlaceId = "";
    this.destinationPlaceId = "";
    this.travelMode = google.maps.TravelMode.WALKING;
    this.directionsService = new google.maps.DirectionsService();
    this.directionsRenderer = new google.maps.DirectionsRenderer();
    this.unitSystem = null;
    this.fetchAndDisplayRoutes = fetchAndDisplayRoutes;

    this.directionsRenderer.setMap(map);
    this.sidebar = document.getElementById("sidebar");
    this.directionsRenderer.setPanel(sidebar);

    const originInput = document.getElementById("origin-input");
    const destinationInput = document.getElementById("destination-input");

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
      } else if (
        mode === google.maps.TravelMode.WALKING ||
        mode === google.maps.TravelMode.BICYCLING
      ) {
        avoidOptionsDiv.style.display = "block";
        document.getElementById("avoid-highways").style.display = "none";
        document.getElementById("avoid-tolls").style.display = "none";
        document.getElementById("avoid-ferries").style.display = "block";
      } else {
        avoidOptionsDiv.style.display = "none";
        document.getElementById("avoid-highways").style.display = "none";
        document.getElementById("avoid-tolls").style.display = "none";
        document.getElementById("avoid-ferries").style.display = "none";
      }

      if (mode === google.maps.TravelMode.DRIVING) {
        departureInput.style.display = "block";
        departureH4.style.display = "block";
        arrivalInput.style.display = "none";
        arrivalH4.style.display = "none";
        arrivalInput.value = "";
        transit_options.style.display = "none";
        document.getElementById("unit-system").style.display = "block";
      } else if (mode === google.maps.TravelMode.TRANSIT) {
        arrivalInput.style.display = "block";
        arrivalH4.style.display = "block";
        departureInput.style.display = "block";
        departureH4.style.display = "block";
        transit_options.style.display = "block";
        document.getElementById("unit-system").style.display = "none";
        unitSystemRadios.forEach((radio) => {
          radio.checked = false;
        });
      } else {
        arrivalInput.style.display = "none";
        arrivalH4.style.display = "none";
        departureInput.style.display = "none";
        departureH4.style.display = "none";
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
        departureInput.value = "";
        alert("A data inserida é anterior à data atual. Por favor, insira uma data válida.");
      } else {
        this.route();
        document.getElementById("arrival-time").value = "";
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
        alert("A data inserida é anterior à data atual. Por favor, insira uma data válida.");
      } else {
        this.route();
        document.getElementById("departure-time").value = "";
      }
    });
    if (arrivalInput.value) {
      return new Date(arrivalInput.value);
    }
    return null;
  }

  getTransitOptions() {
    const modeCheckboxes = document.querySelectorAll(
      '#transit-options input[type="checkbox"]'
    );
    const routingPreferenceRadios = document.querySelectorAll(
      '#transit-options input[type="radio"]'
    );

    modeCheckboxes.forEach((checkbox) => {
      checkbox.addEventListener("change", () => {
        this.route();
      });
    });

    routingPreferenceRadios.forEach((radio) => {
      radio.addEventListener("change", () => {
        this.route();
      });
    });

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

    google.maps.event.clearListeners(autocomplete, "place_changed");

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();

      if (!place.place_id) {
        window.alert("Por favor, escolha uma opção da lista.");
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
      document.getElementById("noRouteFound").style.display = "block";
      document.getElementById("origin-input").value = "";
      document.getElementById("destination-input").value = "";
      document.getElementById("arrival-time").value = "";
      document.getElementById("departure-time").value = "";
      this.directionsRenderer.setDirections({ routes: [] });
      clearButton.disabled = true;
      saveButton.disabled = true;
    });
  }

  setupSwapButtonListener(id) {
    const swapButton = document.getElementById(id);

    swapButton.addEventListener("click", () => {
      const originInput = document.getElementById("origin-input");
      const destinationInput = document.getElementById("destination-input");

      if (originInput.autocomplete) {
        google.maps.event.clearInstanceListeners(originInput.autocomplete);
        originInput.autocomplete = null;
      }
      if (destinationInput.autocomplete) {
        google.maps.event.clearInstanceListeners(destinationInput.autocomplete);
        destinationInput.autocomplete = null;
      }
      console.log("Antes: " + originInput.value, destinationInput.value);
      [originInput.value, destinationInput.value] = [
        destinationInput.value,
        originInput.value,
      ];
      console.log("Depois: " + originInput.value, destinationInput.value);

      [this.originPlaceId, this.destinationPlaceId] = [
        this.destinationPlaceId,
        this.originPlaceId,
      ];

      const originAutocomplete = new google.maps.places.Autocomplete(
        originInput,
        { fields: ["place_id"] }
      );
      const destinationAutocomplete = new google.maps.places.Autocomplete(
        destinationInput,
        { fields: ["place_id"] }
      );

      this.setupPlaceChangedListener(originAutocomplete, "ORIG");
      this.setupPlaceChangedListener(destinationAutocomplete, "DEST");

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
      unitSystem: this.unitSystem,
    };

    if (this.travelMode === google.maps.TravelMode.TRANSIT) {
      request.transitOptions = {
        arrivalTime: this.getArrivalTime(),
        departureTime: this.getDepartureTime(),
        ...this.getTransitOptions()(),
      };
      request.unitSystem = google.maps.UnitSystem.METRIC;
    }

    if (
      this.travelMode === google.maps.TravelMode.DRIVING &&
      this.getDepartureTime()
    ) {
      request.avoidHighways = this.getAvoidOptions().avoidHighways;
      request.avoidTolls = this.getAvoidOptions().avoidTolls;
      request.avoidFerries = this.getAvoidOptions().avoidFerries;
      request.drivingOptions = {
        departureTime: this.getDepartureTime(),
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
      request.avoidFerries = this.getAvoidOptions().avoidFerries;
    }

    document.getElementById("save").addEventListener("click", async () => {
      try {
        const response = await fetch("http://127.0.0.1:420/routes", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: getCookie("token"),
          },
          body: JSON.stringify(request),
        });
        console.log(JSON.stringify(request));

        if (response.ok) {
          fetchAndDisplayRoutes();
        } else {
          console.error(`Falha ao salvar a rota: ${response.statusText}`);
        }
      } catch (error) {
        console.error("Erro ao salvar a rota:", error);
      }
    });

    this.directionsService.route(request, (response, status) => {
      if (status === "OK") {
        me.directionsRenderer.setDirections(response);
        document.getElementById("clear-directions").disabled = false;
        document.getElementById("save").disabled = false;
        document.getElementById("noRouteFound").style.display = "none";
      } else if (status === "ZERO_RESULTS") {
        window.alert("Sem resultados.");
      } else if (status === "MAX_ROUTE_LENGTH_EXCEEDED") {
        window.alert("A rota excede o comprimento máximo permitido.");
      } else {
        window.alert("Pedido falhou com erro: " + status);
      }
    });
  }
}

initMap();
