//initializing global variables
var map, pos = { lat: null, lng: null }, geocoder, infoWindow = null, dangerAlerts = [], markers = [], centerControl, controlUI, centerControlDiv, controlText;
//dangeralert class object
class DangerAlert {
  constructor(UUID, location, creationTimeStamp) {
    this.UUID = UUID;
    this.location = location;
    this.creationTimeStamp = creationTimeStamp;
    this.status = "initial";
    //
    //add to array of dangeralert
    dangerAlerts.push(this);
    updateSidebar(this, true);
    //
    this.removeDangerAlert = function removeDangerAlert() {
      dangerAlerts.splice(dangerAlerts.indexOf(this), 1);
      updateSidebar(this, false);
    }
  }
}
class LocationPin {
  constructor(lat, lng) {
    this.lat = lat;
    this.lng = lng;
  }
}
//initialize the google map 
function initMap() {
  //assign global variables
  map = new google.maps.Map(document.getElementById('map'), {
    center: { lat: 25.312525, lng: 55.494408 },
    zoom: 12,
    fullscreenControl: false
  });
  geocoder = new google.maps.Geocoder;
  errorInfoWindow = new google.maps.InfoWindow;
  //
  // Create the DIV to hold the control and call the CenterControl()
  // constructor passing in this DIV.
  centerControlDiv = document.createElement('div');
  centerControl = new CenterControl(centerControlDiv, map);

  centerControlDiv.index = 1;
  map.controls[google.maps.ControlPosition.TOP_RIGHT].push(centerControlDiv);
  //
  loadDangerZones();
  //
  initAlertListener();

  // Try HTML5 geolocation.
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function (position) {
      pos = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      map.setCenter(pos);
      //start simulation scripts
      // simulateDangerAlerts(pos, map);
      // simulateConfirmation(map);




    }, function () {
      handleLocationError(true, errorInfoWindow, map.getCenter());
    });
  } else {
    // Browser doesn't support Geolocation
    handleLocationError(false, errorInfoWindow, map.getCenter());
  }

}
//
loadDangerZones(pos);
//
initAlertListener();
function handleLocationError(browserHasGeolocation, errorInfoWindow, pos) {
  errorInfoWindow.setPosition(pos);
  errorInfoWindow.setContent(browserHasGeolocation ?
    'Error: The Geolocation service failed.' :
    'Error: Your browser doesn\'t support geolocation.');
  errorInfoWindow.open(map);
}
//draw marker on gmap
function drawAlertMarker(map, dangerAlert) {
  var marker = new google.maps.Marker({
    position: dangerAlert.location,
    map: map,
    title: 'Hello World!',
    UUID: dangerAlert.UUID,
    status: 'initial',
    icon: {
      // path: google.maps.SymbolPath.CIRCLE,
      scale: 2,
      fillColor: 'white',
      fillOpacity: 1,
      strokeWeight: 2,
      strokeColor: 'red',
    },
  });
  //add to array
  markers.push(marker);
  //content string for infoWindow
  var contentString = '<div class="alert-infowindow" id="infoWindow-' + dangerAlert.UUID + '" >                                             <span>Alert ID: ' + dangerAlert.UUID + '</span>                      <span>Created at:  ' + new Date(dangerAlert.creationTimeStamp).toLocaleString() + '</span>   <span>Status:  ' + dangerAlert.status + '</span>                        <span><button>Respond</button>                                                               </div>';
  //add click event to marker
  marker.addListener('click', function () {
    closeOpenAlert();
    //add class to corresponding <li>
    var correspondingLi = document.querySelector('li[data-uuid="' + dangerAlert.UUID + '"]');
    correspondingLi.classList.add('danger-alert-focused');
    //scroll into view if not already in viewport
    clBounding = correspondingLi.getBoundingClientRect();
    if (
      clBounding.top >= document.querySelector('div#header-container').getBoundingClientRect().height &&
      clBounding.bottom <= (window.innerHeight || document.documentElement.clientHeight)
    ) {
    } else {
      correspondingLi.scrollIntoView({
        behavior: 'smooth'
      });
    }
    infoWindow = new google.maps.InfoWindow({
      content: contentString
    });
    map.panTo(marker.position);
    infoWindow.open(map, marker);
  });
}

function closeOpenAlert() {
  //close open infowindows
  if (infoWindow) {
    infoWindow.close();
  }
  //remove class from <li>
  var activeAlertLis = document.getElementsByClassName('danger-alert-focused');
  if (activeAlertLis.length > 0) {
    for (i = 0; i < activeAlertLis.length; i++) {
      activeAlertLis[i].classList.remove('danger-alert-focused')
    }
  }
}
var onClickFunction = function () {
  if (map) {
    // var markers = map.markers;
    closeOpenAlert();

    var thisLi = this;
    thisLi.classList.add('danger-alert-focused');
    var correspondingMarker = markers.find(function (element) {
      return element.UUID == thisLi.getAttributeNode('data-uuid').value;
    });
    var correspondingDangerAlert = dangerAlerts.find(function (element) {
      return element.UUID == thisLi.getAttributeNode('data-uuid').value;
    });
    var contentString = '<div class="alert-infowindow" id="infoWindow-' + correspondingDangerAlert.UUID + '"><span style = "display:block">Alert ID: ' + correspondingDangerAlert.UUID + '</span><span style = "display:block">Created at:  ' + new Date(correspondingDangerAlert.creationTimeStamp).toLocaleString() + '</span><span style = "display:block">Status:  ' + correspondingDangerAlert.status + '</span><button>Respond</button></div>';
    //
    if (infoWindow) {
      infoWindow.close();
    }
    infoWindow = new google.maps.InfoWindow({
      content: contentString
    });
    var button = infoWindow.content;
    map.panTo(correspondingMarker.position);
    infoWindow.open(map, correspondingMarker);
  }
}
// 
function updateSidebar(correspondingDangerAlert, addOrRemove) {
  if (addOrRemove) {
    var consoleSidebarOL = document.getElementById('console-sidebar-ol');
    var li = document.createElement('li');
    var contentString = '<div class="sidebarLi status-' + correspondingDangerAlert.status + 'id="sidebarLi-' + correspondingDangerAlert.UUID + '">                                    <span style = "display:block">Alert ID: ' + correspondingDangerAlert.UUID + '</span><span style = "display:block">Created at:  ' + new Date(correspondingDangerAlert.creationTimeStamp).toLocaleString() + '</span><span style = "display:block">Status:  ' + correspondingDangerAlert.status + '</span>  <span class="status-indicator"></span><button onclick=respondFunction(' + correspondingDangerAlert.UUID + ')>Respond</button></div>';
    var div = document.createElement('div');
    li.innerHTML = contentString;
    //add ID that will associate it with marker on map
    var UUIDattr = document.createAttribute('data-uuid');
    UUIDattr.value = correspondingDangerAlert.UUID;
    li.setAttributeNode(UUIDattr);
    li.onclick = onClickFunction;

    //append li element
    // li.appendChild(div);
    consoleSidebarOL.appendChild(li);
  }
  else { }
}

function respondFunction(UUID) {
  // var dangerAlert =
  console.log(UUID);
}
//generate unique identifier string
function uuidv4() {
  return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  )
}
//function to simulate the creation of danger alerts
function simulateDangerAlerts(pos, map) {
  var max = 20, counter = 0, createDangerAlert, intervalId, confirmationSimInterval;
  createDangerAlert = function () {
    counter++;
    if (counter <= max) {
      locationPin = new LocationPin(pos.lat + ((Math.random() * 10 % 2 - 2) / 20), pos.lng - ((Math.random() * 10 % 2 - 1)) / 20);
      dangerAlert = new DangerAlert(counter, locationPin);
      drawAlertMarker(map, dangerAlert);
    } else {
      clearInterval(intervalId);
    }
  }
  intervalId = setInterval(createDangerAlert, 6000);
}
//function to simulate unconfirmed alerts being confirme
function simulateConfirmation(map) {
  setInterval(function () {
    var length = dangerAlerts.length;
    var targetIndex = Math.floor(Math.random() * 100) % length;
    var targetAlert = dangerAlerts[targetIndex];
    if (targetAlert.status == 'initial') {
      changeAlertStatus(targetAlert, 'confirmed');
      var correspondingMarker = markers.find(function (element) {
        return element.UUID == dangerAlert.UUID;
      });
      correspondingMarker.status = 'confirmed';
      correspondingMarker.icon.fillColor = 'red';
      correspondingMarker.setMap(null);
      correspondingMarker.setMap(map);
    }
  }, 9542)
}
function changeAlertStatus(dangerAlert, status) {
  dangerAlert.status = status;
}

function initAlertListener() {
  console.log('initing');
  var succesfulinit = false;


  $.getJSON("/alert/update-console", function (result) {
    succesfulinit = true;
    if (!pos || !pos.lat || !pos.lng) {
      pos.lat = 25.3125056,
        pos.lng = 55.4943655

    }

    result.map(function (alert) {
      if (!dangerAlerts.some(function (loggedAlert) { return loggedAlert.UUID == alert.id })) {
        var id, coords = {}, time;
        if (alert) {
          id = alert.id || undefined;
          coords = alert.value.coords || {
            lat: undefined, lng: undefined
          };
          coords.lat = pos.lat + ((coords.lat - ((Math.random() * 10) % 4.5)) / 50);
          coords.lng = pos.lng + ((coords.lng - ((Math.random() * 10) % 4.5)) / 50);
          time = alert.value.time;
        }

        var dangerAlert = new DangerAlert(id, coords, time);
        drawAlertMarker(map, dangerAlert);

      }
    })

  });

  // intervalId = setInterval(function () {
  //   $.getJSON("/alert/update-console", function (result) {
  //     if (!pos || !pos.lat || !pos.lng) {
  //       pos.lat = 25.3125056,
  //         pos.lng = 55.4943655
  //     }

  //     result.map(function (alert) {
  //       if (!dangerAlerts.some(function (loggedAlert) { return loggedAlert.UUID == alert.id })) {
  //         var id, coords = {}, time;
  //         if (alert) {
  //           id = alert.id || undefined;
  //           coords = alert.key.coords || {
  //             lat: undefined, lng: undefined
  //           };
  //           coords.lat = pos.lat + ((coords.lat - ((Math.random() * 10) % 4.5)) / 50);
  //           coords.lng = pos.lng + ((coords.lng - ((Math.random() * 10) % 4.5)) / 50);
  //           time = alert.key.time;
  //         }

  //         var dangerAlert = new DangerAlert(id, coords, time);
  //         drawAlertMarker(map, dangerAlert);
  //       }
  //     })
  //   });
  // }, 10000);

}
var dangerZones = [];
function CenterControl(controlDiv, map) {

  // Set CSS for the control border.
  controlUI = document.createElement('div');
  controlUI.className = 'danger-zone-info-container';
  controlDiv.appendChild(controlUI);

  // Set CSS for the control interior.
  controlText = document.createElement('div');
  controlText.className = 'danger-zone-info'
  controlText.innerHTML = 'Center Map';
  controlUI.appendChild(controlText);


  // Setup the click event listeners: simply set the map to Chicago.
  // controlUI.addEventListener('click', function () {
  //   map.setCenter(chicago);
  // });

}
function loadDangerZones(pos) {
  console.log(pos);
  $.getJSON("/danger-zones/area2", function (result) {
    succesfulinit = true;
    result.map(function (dangerZone) {
      if (!dangerZones.some(function (loggedZone) { return loggedZone == dangerZone.id })) {
        dangerZones.push(dangerZone.id);
        var cityCircle = new google.maps.Circle({
          strokeColor: '#FF0000',
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: '#8DA3AD',
          fillOpacity: 0.35,
          map: map,
          center: dangerZone.value.location,
          radius: Math.sqrt(dangerZone.value.temp) * 200
        });
        var infoUL = document.createElement('ul');
        infoUL.classList.add('dangerZoneUl')
        var tempLi = document.createElement('li');
        tempLi.innerHTML = 'temp: ' + dangerZone.value.temp + ' degrees';
        var humidityLi = document.createElement('li');
        humidityLi.innerHTML = 'humidity: ' + dangerZone.value.humidity;
        infoUL.appendChild(tempLi);
        infoUL.appendChild(humidityLi);

        cityCircle.addListener('mouseover', function () {
          controlText.innerHTML = '';
          controlText.appendChild(infoUL);
          controlUI.classList.add('hovered');
        })
        cityCircle.addListener('mouseout', function () {
          // controlText.innerHTML = 'yo';
          controlUI.classList.remove('hovered');
        })
      }
    })

  });
}



