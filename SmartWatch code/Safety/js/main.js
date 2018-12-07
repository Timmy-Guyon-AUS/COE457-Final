var lat;
var lng;
var dateTime;
var displaySafe = true; //to display safetyConfirmed html page
var alertStatus = 'confirmed';

/* Opens the html page for where a PIN is required to confirm safety */
function CheckIfSafe() {
  console.log('Called: CheckIfSafe');
  window.open("ConfirmSafety.html", "_self");
}

/* Opens the danger confirmation page */
function inDanger(alertStatus) {

  console.log('Called: inDanger');
  displaySafe = false;
  dateTime = tizen.time.getCurrentDateTime();

  // ********* send data over mqtt *****************
  websocketclient.publish('S2watch/w1/alert_status', alertStatus, 1, false);
  websocketclient.publish('S2watch/w1/dateTime', dateTime.toString(), 1, false);

  //getGPSLocation();
  window.open("DangerConfirmed.html", "_self" );
}

//Gets user location
function getGPSLocation() {
  console.log('Called: getGPSLocation');

  //GPS
  navigator.geolocation.watchPosition(success, error, { enableHighAccuracy: false, timeout: 50000 });

}

// Callback in case of error
function error(error) {
  console.log('Called: error');

  switch (error.code) {
    case error.PERMISSION_DENIED:
      console.log("Called: permission denied");
      alert("Called: permission denied");
      break;
    case error.POSITION_UNAVAILABLE:
      console.log("Called: your position is unavailable");
      alert("Called: your position is unavailable");
      break;
    case error.TIMEOUT:
      console.log("Called: a timeout occured");
      alert("Called: a timeout occured");
      break;
    case error.UNKNOWN_ERROR:
      console.log("Called: an unknow error occured");
      alert("Called: an unknow error occured");
      break;
  }
}

// Callback in case of error
function success(position) {
  console.log('Called: success');

  lat = position.coords.latitude;
  lng = position.coords.longitude;

  console.log("Current position Test: " + lat + " " + lng);
  console.log('after GPS')

  alert('Success' + lat + " " + lng);
  websocketclient.publish('S2watch/w1/location', "position: " + lat + " " + lng, 1, false);

  window.open("DangerConfirmed.html", "_self");
  tizen.power.release("SCREEN"); // allow screen to go off in case of no activity
}


/* WATCH ALARM TO DO SMTH IN BACKGROUND 
var appIdDevice = "aihoIodnCY.DisplayMyName";	

/*
var alarmRelative1 = new tizen.AlarmRelative(0.2 * tizen.alarm.PERIOD_MINUTE, 0.2 * tizen.alarm.PERIOD_MINUTE);
tizen.alarm.add(alarmRelative1, appIdDevice);	// alarm added to emulator 

*/