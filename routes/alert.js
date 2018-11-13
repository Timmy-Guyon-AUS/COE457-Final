var express = require("express");
var app = express();
var cfenv = require("cfenv");
var bodyParser = require('body-parser')

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
// parse application/json
app.use(bodyParser.json())

//
const router = express.Router();

/// const nano = require('nano')('http://localhost:5984');
/// const alerts_db = nano.db.use('alerts');
//
//
//
//
// // load local VCAP configuration  and service credentials
var vcapLocal;
try {
  vcapLocal = require('./vcap-local.json');
  console.log("Loaded local VCAP", vcapLocal);
} catch (e) { }
//
const appEnvOpts = vcapLocal ? { vcap: vcapLocal } : {}
const appEnv = cfenv.getAppEnv(appEnvOpts);
// Load the Cloudant library.
var Cloudant = require('@cloudant/cloudant');

var cloudant, alertsDB;
if (appEnv.services['COE457-cloudantNoSQLDB'] || appEnv.getService(/cloudant/)) {
  // Initialize database with credentials
  if (appEnv.services['COE457-cloudantNoSQLDB']) {
    // CF service named 'COE457-cloudantNoSQLDB'
    cloudant = Cloudant(appEnv.services['COE457-cloudantNoSQLDB'][0].credentials);
  } else {
    // user-provided service with 'cloudant' in its name
    cloudant = Cloudant(appEnv.getService(/cloudant/).credentials);
  }
} else if (process.env.CLOUDANT_URL) {
  cloudant = Cloudant(process.env.CLOUDANT_URL);
} else {
  console.log('ahhhh')
  var cloudantCredentialsJSON = require('./../cloudant-credentials.json');
  cloudant = Cloudant(cloudantCredentialsJSON.url);
}
if (cloudant) {
  //database name
  var alertsDBName = 'alerts';

  // Create a new "mydb" database.
  cloudant.db.create(alertsDBName, function (err, data) {
    if (!err) //err if database doesn't already exists
      console.log("Created database: " + alertsDBName);
  });

  // Specify the database we are going to use (mydb)...
  alertsDB = cloudant.db.use(alertsDBName);
}






router.post("/process-create-alert", (req, res) => {
  var alert;

  alert = JSON.parse(req.body.postData);
  if (!alertsDB) {
    console.trace("No database.");
    res.send(alert);
    return;
  }
  // insert the username as a document
  alertsDB.insert(alert, function (err, body, header) {
    if (err) {
      console.log('[alertsDB.insert] ', err.message);
      res.send("Error");
      return;
    }
    alert._id = body.id;
    res.send(alert);
  });

});
// router.get("/update-console", (req, res) => {
//   // Prepare output in JSON format
//   alerts_db.view('browser-side-views', 'view_all_alerts', function (err, body) {
//     if (!err) {
//       var rows = body.rows; //the rows returned
//       res.end(JSON.stringify(rows))
//     } else {
//       console.log(err);
//     }
//   }
//   );
// });




module.exports = router;
