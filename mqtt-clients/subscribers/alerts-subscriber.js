//
//Middleware - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
var mqtt = require('mqtt');
var client = mqtt.connect('mqtt://test.mosquitto.org');
var cfenv = require("cfenv");
//
//IBM Cloud Foundry App Config Variables- - - - - - - - - - - - - - - - - - - - 
//load local VCAP configuration  and service credentials
var alertsDB;
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
      var cloudantCredentialsJSON = require('./../../cloudant-credentials.json');
      cloudant = Cloudant(cloudantCredentialsJSON.url);
}
if (cloudant) {
      //database name
      alertsDBName = 'alerts';
      // Create a new "mydb" database.
      cloudant.db.create(alertsDBName, function (err, data) {
            if (!err) //err if database doesn't already exists
                  console.log("Created database: " + alertsDBName);
      });
      // Specify the database we are going to use (alertsdb)...
      alertsDB = cloudant.db.use(alertsDBName);
}
//Db setup ^
//MQTT client- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
client.on('connect', function () {
      client.subscribe('alert/initial-alert', function (err) {

      })
})

client.on('message', function (topic, message) {
      // insert alert into alertsDB
      console.log("messaged recieved to topic: " + topic + " " + message);
      var alert = JSON.parse(message.toString());
      
      if (alertsDB) {
            if(!alert.status){
                  alert.status = 'initial';
            }
            alertsDB.insert(alert, function (err, body, header) {
                  if (err) {
                        console.log('[alertsDB.insert] ', err.message);
                        return;
                  }
                  alert._id = body.id;
            });
      }
})
module.exports = client;
