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
var cloudant, areasDB;
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
  var areasDBName = 'areas';
  // Create a new "mydb" database.
  cloudant.db.create(areasDBName, function (err, data) {
    if (!err) //err if database doesn't already exists
      console.log("Created database: " + areasDBName);
  });
  // Specify the database we are going to use (areasdb)...
  areasDB = cloudant.db.use(areasDBName);
}
//
// //Routes- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

router.get("/danger-zones/:areaParam", (req, res) => {
  // Prepare output in JSON format
  areasDB.view('browser-side-views', 'view-danger-zones', {
    key: req.params.areaParam
  }, (err, body) => {
    if (!err) {
      var rows = body.rows; //the rows returned
      res.end(JSON.stringify(rows))
    } else {
      console.log(err);
    }
  });
});




module.exports = router;
