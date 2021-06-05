var data = [];

fetch("data.json") 
	.then(response => response.json()) 
	.then(json => {
        data = json;
    }); 

var myLatLng = { lat: 51.5, lng: -0.1 };
var mapOptions = {
    center: myLatLng,
    zoom: 2,
    mapTypeId: google.maps.MapTypeId.ROADMAP

};

//create map
var map = new google.maps.Map(document.getElementById('googleMap'), mapOptions);

//create a DirectionsService object to use the route method and get a result for our request
var directionsService = new google.maps.DirectionsService();

//create a DirectionsRenderer object which we will use to display the route
var directionsDisplay = new google.maps.DirectionsRenderer();

const geocoder = new google.maps.Geocoder();

//bind the DirectionsRenderer to the map
directionsDisplay.setMap(map);

let originLat, originLng, destinationLat, destinationLng, marker1, marker2, flightPath;

//define calcRoute function
async function calcRoute() {
    //create request
    let origin = document.getElementById("from").value
    let destination = document.getElementById("to").value
    var request = {
        origin: origin,
        destination: destination,
        travelMode: google.maps.TravelMode.TRANSIT, //WALKING, BYCYCLING, TRANSIT
        unitSystem: google.maps.UnitSystem.METRIC
    }

    // clear markers
    if (marker1)
        marker1.setMap(null);
    if (marker2)
        marker2.setMap(null);

    // clearing polyline
    if (flightPath)
        flightPath.setMap(null);

    let promiseOrigin = new Promise((resolve, reject) =>
        geocoder.geocode({ address: origin }, (results, status) => {
            if (status === "OK") {
                let loc = results[0].geometry.location;
                // alert("location : " + loc.lat() + " " + loc.lng()); 
                originLat = Number(loc.lat());
                originLng = Number(loc.lng());
                map.setCenter(loc);
                marker1 = new google.maps.Marker({
                    map: map,
                    label: 'A',
                    position: loc,
                });
                resolve("ok");
            } else {
                alert("Flight Source location is either empty or invalid");
            }
        })
    );

    let promiseDest = new Promise((resolve, reject) =>
        geocoder.geocode({ address: destination }, (results, status) => {
            if (status === "OK") {
                let loc = results[0].geometry.location;
                // alert("location : " + loc.lat() + " " + loc.lng()); 
                destinationLat = Number(loc.lat());
                destinationLng = Number(loc.lng());
                map.setCenter(loc);
                marker2 = new google.maps.Marker({
                    map: map,
                    label: 'B',
                    position: loc,
                });
                resolve("ok");
            } else {
                alert("Flight Destination is either empty or invalid");
            }
        }));

    Promise.all([promiseOrigin, promiseDest]).then(() => {
        const flightPlanCoordinates = [
            { lat: originLat, lng: originLng },
            { lat: destinationLat, lng: destinationLng }
        ];

        flightPath = new google.maps.Polyline({
            path: flightPlanCoordinates,
            geodesic: true,
            strokeColor: "#FF0000",
            strokeOpacity: 1.0,
            strokeWeight: 2,
        });
        flightPath.setMap(map);

        var distance = Math.ceil(haversine_distance(marker1, marker2));
        document.getElementById("distance-covered").innerHTML = `Total distance covered: ${distance} miles`;
        document.getElementById("distance-covered").style.display = 'visible';

        calculateCarbon(distance);
    });

}

// calculating the distance from origin to destination
function haversine_distance(marker1, marker2) {
    var R = 3958.8; // Radius of the Earth in miles
    var rlat1 = marker1.position.lat() * (Math.PI / 180); // Convert degrees to radians
    var rlat2 = marker2.position.lat() * (Math.PI / 180); // Convert degrees to radians
    var difflat = rlat2 - rlat1; // Radian difference (latitudes)
    var difflon = (marker2.position.lng() - marker1.position.lng()) * (Math.PI / 180); // Radian difference (longitudes)

    var d = 2 * R * Math.asin(Math.sqrt(Math.sin(difflat / 2) * Math.sin(difflat / 2) + Math.cos(rlat1) * Math.cos(rlat2) * Math.sin(difflon / 2) * Math.sin(difflon / 2)));
    return d;
}

function calculateCarbon(distance) {
    let e = document.getElementById("inputAircraft");
    var aircraftSelected = e.options[e.selectedIndex].text; //Aircraft Type
    let aircraft = data.filter(e => {
        return e['Name'] == (aircraftSelected)
    })
    if (aircraft.length > 0) {
        let distanceNauticalMiles = distance * 0.868976; // miles to nautical miles
        let flightTime = distance / Number(aircraft[0]['Cruise Speed (Knots)']);
        let charterCost = flightTime * Number((aircraft[0]['Charter ($)']).replace(/,/g, ''));
        let ownershipCost = flightTime * Number(aircraft[0]['Ownership Hourly ($)']);

        let fuelBurn = flightTime * Number(aircraft[0]['Fuel Burn (Hour)']);

        document.getElementById("flight-time").innerHTML = flightTime.toFixed(2) + ' hrs';
        document.getElementById("charter-cost").innerHTML = '$ ' + charterCost.toLocaleString('en-US', {maximumFractionDigits:2})
        document.getElementById("ownership-cost").innerHTML = '$ ' + ownershipCost.toLocaleString('en-US', {maximumFractionDigits:2})
        document.getElementById("fuel-burn").innerHTML = fuelBurn.toFixed(2);
    }
}

//create autocomplete objects for all inputs
var options = {
    types: ['(cities)']
}

var input1 = document.getElementById("from");
var autocomplete1 = new google.maps.places.Autocomplete(input1, options);

var input2 = document.getElementById("to");
var autocomplete2 = new google.maps.places.Autocomplete(input2, options);
