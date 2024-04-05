async function initMap() {
  const { Map } = await google.maps.importLibrary("maps");
  const { AdvancedMarkerView } = await google.maps.importLibrary("marker");
  const { DirectionsService, DirectionsRenderer } = await google.maps.importLibrary("routes");
  const { Places } = await google.maps.importLibrary("places");

  const CenterOfPortugal = { lat: 39.4573914, lng: -8.0065354 };
  const waypoint = { lat: 38.63206355815076, lng: -9.162405460490177 };

    let map;
    let marker;
    let infoWindow;

 map = new google.maps.Map(document.getElementById("map"), {
    zoom: 7,
    center: CenterOfPortugal,
    mapId: "667759e759cedcf9",
    options: {
      gestureHandling: "greedy",
    },
    mapTypeControl: false,
  });

  const placeAutocomplete = new google.maps.places.PlaceAutocompleteElement();
  placeAutocomplete.id = "place-autocomplete-card";
  const card = document.getElementById("place-autocomplete-card");

  card.appendChild(placeAutocomplete);
  // Create the marker and info window

  marker = new google.maps.marker.AdvancedMarkerElement({
    map,
  });
  infoWindow = new google.maps.InfoWindow({});

  // Add the gmp-place select listener, and display the results on the map.
  placeAutocomplete.addEventListener("gmp-placeselect", async ({ place }) => {
    await place.fetchFields({
      fields: ["displayName", "formattedAddress", "location"],
    });
    // If the place has a geometry, then present it on a map.
    if (place.viewport) {
      map.fitBounds(place.viewport);

      
    } else {
      map.setCenter(place.location);
      map.setZoom(10);
    }

    let content =
      '<div id="infowindow-content">' +
      '<span id="place-displayname" class="title">' +
      place.displayName +
      "</span><br />" +
      '<span id="place-address">' +
      place.formattedAddress +
      "</span>" +
      "</div>";

    updateInfoWindow(content, place.location);
    marker.position = place.location;
  });

// Helper function to create an info window.
function updateInfoWindow(content, center) {
  infoWindow.setContent(content);
  infoWindow.setPosition(center);
  infoWindow.open({
    map,
    anchor: marker,
    shouldFocus: false,
  });
}

  // Initialize Directions Service and Renderer
  const directionsService = new DirectionsService();
  const directionsRenderer = new DirectionsRenderer();
  directionsRenderer.setMap(map);

  // Function to calculate and display route
  async function calculateAndDisplayRoute(origin, destination) {
    const request = {
      origin: origin,
      destination: destination,
      travelMode: google.maps.TravelMode.DRIVING, // Use the google.maps object
    };

    const result = await directionsService.route(request);
    directionsRenderer.setDirections(result);

    // Extract the distance, duration, start address, and end address from the first route and leg
    const route = result.routes[0];
    const leg = route.legs[0];
    const distance = leg.distance.text;
    const duration = leg.duration.text;
    const startAddress = leg.start_address;
    const endAddress = leg.end_address;

    // Display the distance, duration, start address, and end address
    routeInfo.innerHTML = `
    <div class="route">
        <h3>Detalhes da Rota</h3>
        <p><strong style="color: black;">Local de Partida:</strong> ${startAddress}</p>
        <p><strong style="color: black;">Destino:</strong> ${endAddress}</p>
        <p><strong style="color: black;">Distância:</strong> ${distance}</p>
        <p><strong style="color: black;">Duração:</strong> ${duration}</p>
    </div>
    `;
    routeInfo.style.color = "black";
  }

  // Request user's location
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        map.setCenter({ lat: latitude, lng: longitude });

        // Set marker at user's location
        const marker = new google.maps.marker.AdvancedMarkerElement({
          position: { lat: latitude, lng: longitude },
          map: map,
        });

        // Call the function to calculate and display route
        await calculateAndDisplayRoute(
          { lat: latitude, lng: longitude },
          waypoint
        );
      },
      (error) => {
        console.error("Error getting user's location:", error);
        map.setCenter(CenterOfPortugal); // Set center to waypoint
      }
    );
  } else {
    console.error("Geolocation is not supported by this browser.");
    map.setCenter(CenterOfPortugal); // Set center to waypoint
  }
}

initMap();