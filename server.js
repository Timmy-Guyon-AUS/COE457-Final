const express = require("express");
const app = express();
const cfenv = require("cfenv");
const bodyParser = require('body-parser')
const expressSession = require("express-session");
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
// parse application/json
app.use(bodyParser.json())
//
const alertsRoute = require("./routes/alert");







// var cloudant, mydb;
// /* Endpoint to greet and add a new visitor to database.
// * Send a POST request to localhost:3000/api/visitors with body
// * {
// * 	"name": "Bob"
// * }
// */
// app.post("/api/visitors", function (request, response) {
//   var userName = request.body.name;
//   var doc = { "name" : userName };
//   if(!mydb) {
//     console.log("No database.");
//     response.send(doc);
//     return;
//   }
//   // insert the username as a document
//   mydb.insert(doc, function(err, body, header) {
//     if (err) {
//       console.log('[mydb.insert] ', err.message);
//       response.send("Error");
//       return;
//     }
//     doc._id = body.id;
//     response.send(doc);
//   });
// });

/**
 * Endpoint to get a JSON array of all the visitors in the database
 * REST API example:
 * <code>
 * GET http://localhost:3000/api/visitors
 * </code>
 *
 * Response:
 * [ "Bob", "Jane" ]
 * @return An array of all the visitor names
 */
app.get("/api/visitors", function (request, response) {
  var names = [];
  if (!mydb) {
    response.json(names);
    return;
  }

  mydb.list({ include_docs: true }, function (err, body) {
    if (!err) {
      body.rows.forEach(function (row) {
        if (row.doc.name)
          names.push(row.doc.name);
      });
      response.json(names);
    }
  });
});


// // load local VCAP configuration  and service credentials
// var vcapLocal;
// try {
//   vcapLocal = require('./vcap-local.json');
//   console.log("Loaded local VCAP", vcapLocal);
// } catch (e) { }
// //
// const appEnvOpts = vcapLocal ? { vcap: vcapLocal } : {}
// const appEnv = cfenv.getAppEnv(appEnvOpts);
// // Load the Cloudant library.
// var Cloudant = require('@cloudant/cloudant');
// if (appEnv.services['cloudantNoSQLDB'] || appEnv.getService(/cloudant/)) {

//   // Initialize database with credentials
//   if (appEnv.services['cloudantNoSQLDB']) {
//     // CF service named 'cloudantNoSQLDB'
//     cloudant = Cloudant(appEnv.services['cloudantNoSQLDB'][0].credentials);
//   } else {
//     // user-provided service with 'cloudant' in its name
//     cloudant = Cloudant(appEnv.getService(/cloudant/).credentials);
//   }
// } else if (process.env.CLOUDANT_URL) {
//   cloudant = Cloudant(process.env.CLOUDANT_URL);
// }
// if (cloudant) {
//   //database name
//   var dbName = 'mydb';

//   // Create a new "mydb" database.
//   cloudant.db.create(dbName, function (err, data) {
//     if (!err) //err if database doesn't already exists
//       console.log("Created database: " + dbName);
//   });

//   // Specify the database we are going to use (mydb)...
//   mydb = cloudant.db.use(dbName);
// }

//serve static file (index.html, images, css)
app.use(express.static(__dirname + '/views'));










//
//
//
//
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  next();
});
//
app.use(
  expressSession({
    secret: "BREATHE RIGHT",
    // store: new RedisStore({
    //     host: 'localhost',
    //     port: 6379
    // }),
    cookie: {
      maxAge: 60000
    },
    resave: false,
    saveUninitialized: true
  })
);
//
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Credentials", true);
  // res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
  res.header(
    "Access-Control--Headers",
    "X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept"
  );
  if ("OPTIONS" == req.method) {
    res.sendStatus(200);
  } else {
    next();
  }
});
//
app.use("/alert", alertsRoute);
// catch 404 and forward to error handler
app.use(function (req, res, next) {
  let err = new Error("Not Found");
  err.status = 404;
  if (req.accepts("html")) {
    res.sendStatus(404);
    return;
  }
  if (req.accepts("json")) {
    res.send({
      error: "Not found"
    });
    return;
  }
  res.type("txt").send("Not found");
  next();
});







var port = process.env.PORT || 3000
app.listen(port, function () {
  console.log("To view your app, open this link in your browser: http://localhost:" + port);
});
