let map;

async function initMap() {
    const { Map, places } = await google.maps.importLibrary("maps");
    const { AdvancedMarkerView } = await google.maps.importLibrary("marker");
    const portugal = { lat: 39.4573914, lng: -8.0065354 };

    map = new Map(document.getElementById("map"), {
        zoom: 7,
        mapId: "DEMO_MAP_ID",
        mapTypeId: "roadmap",
    });

    // Request user's location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                map.setCenter({ lat: latitude, lng: longitude });

                // Set marker at user's location
                const marker = new AdvancedMarkerView({
                    position: { lat: latitude, lng: longitude },
                    map: map,
                });
            },
            (error) => {
                console.error("Error getting user's location:", error);
                map.setCenter(portugal); // Set center to Portugal
            }
        );
    } else {
        console.error("Geolocation is not supported by this browser.");
        map.setCenter(portugal); // Set center to Portugal
    }
    
}

initMap();