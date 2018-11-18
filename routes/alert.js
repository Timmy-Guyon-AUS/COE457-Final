//
//Middleware - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
var express = require("express");
var app = express();
var cfenv = require("cfenv");
var bodyParser = require('body-parser')
var router = express.Router();
var cors = require('cors');
//
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors);
//
//IBM Cloud Foundry App Config Variables- - - - - - - - - - - - - - - - - - - - 
//load local VCAP configuration  and service credentials
var vcapLocal;
try {
  vcapLocal = require('./vcap-local.json');
  console.log("Loaded local VCAP", vcapLocal);
} catch (e) { }
var appEnvOpts = vcapLocal ? { vcap: vcapLocal } : {};
var appEnv = cfenv.getAppEnv(appEnvOpts);
//
//
//Cloudant library loading and init- - - - - - - - - - - - - - - - - - - - - - -
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
  //if url not retrievable from process.env use cloudant-credentials.json file
  //cloudant-credentials.json is in .gitignore
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
  // Specify the database we are going to use (alertsdb)...
  alertsDB = cloudant.db.use(alertsDBName);
}
//
// //Routes- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
// router.post("/process-create-alert", (req, res) => {
//   var alert;
//   alert = JSON.parse(req.body.postData);
//   if (!alertsDB) {
//     res.send(alert);
//     return;
//   }
//   // insert alert into alertsDB
//   alertsDB.insert(alert, function (err, body, header) {
//     if (err) {
//       console.log('[alertsDB.insert] ', err.message);
//       res.send("Error");
//       return;
//     }
//     alert._id = body.id;
//     res.send(alert);
//   });
// });


router.get("/update-console", (req, res) => {
  // Prepare output in JSON format
  // alertsDB.view('browser-side-views', 'view-all-alerts').then((body) => {
  //   console.log(body.rows);
  //   // body.rows.forEach((doc) => {
  //   //   console.log(doc.value);
  //   // });
  // });
  alertsDB.view('browser-side-views', 'view-all-alerts', function (err, body) {
    if (!err) {
      var rows = body.rows; //the rows returned
      res.end(JSON.stringify(rows))
    } else {
      console.log(err);
    }
  });
});




module.exports = router;
