//
//Middleware - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
var mqtt = require('mqtt');
var client = mqtt.connect('mqtt://test.mosquitto.org');
var cfenv = require("cfenv");
//
//IBM Cloud Foundry App Config Variables- - - - - - - - - - - - - - - - - - - - 
//load local VCAP configuration  and service credentials
var areasDB;
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
      var cloudantCredentialsJSON = require('./../../cloudant-credentials.json');
      cloudant = Cloudant(cloudantCredentialsJSON.url);
}
if (cloudant) {
      //database name
      areaDBName = 'areas';
      // Create a new "mydb" database.
      cloudant.db.create(areaDBName, function (err, data) {
            if (!err) //err if database doesn't already exists
                  console.log("Created database: " + areaDBName);
      });
      // Specify the database we are going to use (areasDB)...
      areasDB = cloudant.db.use(areaDBName);

}
// Cloudant db setup ^
//MQTT client- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
client.on('connect', function () {
      client.subscribe('areas/+/env-data', function (err) {

      })
})

client.on('message', function (topic, message) {
      // insert alert into areasDB
      var topicArray = topic.split("/");
      var envData = JSON.parse(message.toString());
      envData.area = topicArray[1];
      console.log(envData);
      if (areasDB) {
            areasDB.insert(envData, function (err, body, header) {
                  if (err) {
                        console.log('[areasDB.insert] ', err.message);
                        return;
                  }
                  envData._id = body.id;
            });
      }
})
module.exports = client;
