//
//Middleware - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
var mqtt = require('mqtt');
var options = {
      port: 11330,
      host: 'mqtt://m15.cloudmqtt.com',
      clientId: 'mqttjs_' + Math.random().toString(16).substr(2, 8),
      username: 'ouaqwvoe',
      password: 'IGPhMUpKbZMP',
      keepalive: 60,
      reconnectPeriod: 1000,
      protocolId: 'MQIsdp',
      protocolVersion: 3,
      clean: true,
      encoding: 'utf8'
};

var client = mqtt.connect('mqtt://m15.cloudmqtt.com', options);

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

client.on('connect', function () {
      console.log('connected..');
      // subscribe to a topic
      client.subscribe('esp32/#', function () {
            var i = 0;
            client.on('message', function (topic, message, packet) {
                  t = topic.split("/");
                  //store the message in a variable based on the topic
                  if (t[2] == "temperature") {
                        temp = message.toString();
                        i++;
                  }
                  else if (t[2] == "humidity") {
                        humi = message.toString();
                        i++;
                  }
                  else if (t[2] == "light") {
                        lightint = message.toString();
                        i++;
                  }
                  else if (t[2] == "location") {
                        loc = message.toString().split(",");
                        i++;
                  }
                  if (i == 4) { //if all values have been sent, add the value to the databse
                        i = 0;
                        addEnvData();
                  }
                  areaname = t[1]; //area1, area2,...
            });
      });
});

function addEnvData() {
      response = {
            time: new Date().toLocaleString(),
            temperature: temp,
            humidity: humi,
            lightintensity: lightint,
            location: {
                  lat: loc[0],
                  lng: loc[1],
            },
            area: areaname
      };

      id = areaname

      areasDB.insert(response, id, function (err, body, header) {
            // console.log(body);
            if (err) {
                  //when values are published from the same area (microcontroller), update the values in the db 

                  if (err.message == "Document update conflict.") {
                        updateAreaInfo(response);
                  }
            }
      });
}

//update(overwrite) the values in the db for a given area
function updateAreaInfo(response) {
      areasDB.view('browser-side-views', 'view-danger-zones', {
            key: response.area
      }, (err, body) => {
            if (!err) {
                  // console.log(body.rows);
                  for(dangerZone in body.rows){
                        dangerZone = body.rows[dangerZone];
                        // console.log(dangerZone)
                        if(dangerZone.id == response.area){
                              var rev = dangerZone.value['_rev'];
                              if(rev){
                                    response['_rev'] = rev;
                                    areasDB.insert(response, response.area, function (err, body, header) {
                                          // console.log(body);
                                          if (err) {
                                                //when values are published from the same area (microcontroller), update the values in the db 
                              
                                                if (err.message == "Document update conflict.") {
                                                      updateAreaInfo(response);
                                                }
                                          }
                                    });
                              }
                              break;
                        }
                  }
            } else {
                  console.log(err);
            }

      });
      // try {
      //       let doc = areaSafety.get(areaname)
      //       doc.time = new Date().toLocaleString();
      //       doc.temperature = temp;
      //       doc.humidity = humi;
      //       doc.lightintensity = lightint
      //       doc.location = {
      //             "lat": loc[0],
      //             "lng": loc[1]

      //       }
      //       areasDB.insert(doc);

      // } catch (err) {
      //       console.log(err);
      // }
}

//MQTT client- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// client.on('connect', function () {
//       client.subscribe('areas/+/env-data', function (err) {

//       })
// })

// client.on('message', function (topic, message) {
//       // insert alert into areasDB
//       var topicArray = topic.split("/");
//       var envData = JSON.parse(message.toString());
//       envData.area = topicArray[1];
//       console.log(envData);
//       if (areasDB) {
//             areasDB.insert(envData, function (err, body, header) {
//                   if (err) {
//                         console.log('[areasDB.insert] ', err.message);
//                         return;
//                   }
//                   envData._id = body.id;
//             });
//       }
// })
module.exports = client;


alert = {
      id: 'area1',
      key: 'area1',
      value:
      {
            time: '12/13/2018, 1:56:11 PM',
            location: { lat: '25.02165', lng: '55.51354' },
            humidity: '57.60'
      }
} 