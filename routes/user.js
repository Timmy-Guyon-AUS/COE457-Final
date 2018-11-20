//
//Middleware - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
var express = require("express");
var app = express();
var cfenv = require("cfenv");
var bodyParser = require('body-parser')
var urlencodedParser = bodyParser.urlencoded({ extended: false });
var router = express.Router();
//
app.use(urlencodedParser);
app.use(bodyParser.json());
//for encryting the passwords
const bcrypt = require('bcrypt');
const saltRounds = 10;
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
var cloudant, policeDB;
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
  var policeDBName = 'police';
  // Create a new "mydb" database.
  cloudant.db.create(policeDBName, function (err, data) {
    if (!err) //err if database doesn't already exists
      console.log("Created database: " + policeDBName);
  });
  // Specify the database we are going to use (policeDB)...
  policeDB = cloudant.db.use(policeDBName);
}
//
//Routes- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
//when the user submits the signup form, the form data is sent to the server
router.post('/processignup_post', urlencodedParser, function (req, res) {
  // Prepare the sign up form inputs in JSON format

  var userExists = false; //used to check if the user does or doesn't exist in the database 

  //check if the username already exists in the db
  policeDB.view('police-user-views', 'view-username-password', {
    key: req.body.username
  }, (err, body) => {
    if (body.rows.length != 0) { //if the username exists, k = exists 
      userExists = 'exists';
      res.end('failure1'); //send sign in failure due to existing username
    }
  });


  //check if the user already exits in the database and store only non exisitng users to the db
  policeDB.view('police-user-views', 'view-username-email', {
    key: req.body.name
  }, (err, body) => {
    var i = body.rows.length; //get length of rows for entires with the given key 
    //(thus with the same name)
    var j = i - 1;
    if (i > 0) {
      //loop through each entry with the same name as the name entered by the user
      while (j >= 0) {
        //if an entry with the same name and the same email exists, 
        //don't allow user to register
        if (body.rows[j].value.email == req.body.email) {
          userExists = true;
          res.end('failure'); //registration failed is sent as an alert
        }
        j--;
      }
      //if the user doesnot exist add user to the database
      if (!userExists) {
        //user with the same name but different email exists
        //add user to the db
        id = 'police'.concat(req.body.username); //unique id is given to every new entry 
        //add the entry to the db
        bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
          //Store hashed password in the database
          if (!err) {
            response = {
              name: req.body.name,
              username: req.body.username,
              email: req.body.email,
              mobilenumber: req.body.mobilenumber,
              password: hash
            };
            policeDB.insert(response, id, function (err, body, header) {
              if (err) {
                console.log('[policeDB.insert] ', err.message);
                return;
              }
              res.end('success'); //registration successful alert is sent
            });
          }
          else {
            console.log(err);
            res.status(500).send('Error')
          }
        });
      }
    }
    else if (i == 0) {
      //adding a user with a name that doesnot exist in the database
      id = 'police'.concat(req.body.username); //unique id is given to every new entry 
      bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
        //Store hashed password in the database
        if (!err) {
          response = {
            name: req.body.name,
            username: req.body.username,
            email: req.body.email,
            mobilenumber: req.body.mobilenumber,
            password: hash
          };

          policeDB.insert(response, id, function (err, body, header) {
            if (err) {
              console.log('[policeDB.insert] ', err.message);
              return;
            }
            res.end('success'); //registration successful alert is sent
          });
        }
        else {
          console.log(err);
          res.status(500).send('Error')
        }
      });
    }
  });
})

//---------------------------- LOG IN -------------------------------------------------------
//when the user submits the log in form, the data is sent to the server
router.post('/processlogin_post', urlencodedParser, function (req, res) {
  // // Prepare output in JSON format
  // loginresponse = {
  //   theusername: req.body.username,
  //   thepassword: req.body.password
  // };

  //successfully log in user if the username and the corresponding password exists in the database
  policeDB.view('police-user-views', 'view-username-password', {
    key: req.body.username
  }, (err, body) => {
    if (body.rows.length == 0) { //if username doesnot exist in the database, log in fails
      res.end('failure');
    }
    else {
      bcrypt.compare(req.body.password, body.rows[0].value, function (err, result) {
        //if username exists and the entered password is equal to the
        //the db password, log in is successful
        if (result == true) { //passwords are equal
          res.end('success');
        }
        //if username exists in the database but the entered password is not equal to the
        //the db password, log in fails
        else if (result == false) {
          res.end('failure');
        }
      });
    }
  });
})



module.exports = router;
