//
//Middleware - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const express = require("express");
const app = express();
const cfenv = require("cfenv");
const bodyParser = require('body-parser')
const expressSession = require("express-session");
//
//Routes - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const alertsRoute = require("./routes/alert");
 
//
//MQTT Subscribers - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const alertSubscriber = require("./mqtt-clients/subscribers/alerts-subscriber.js")
//
//app.use config - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
//serve static file (index.html, images, css)
app.use(express.static(__dirname + '/views'));
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  next();
});
//
app.use(
  expressSession({
    secret: "BREATHE RIGHT",
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
//
app.use("/alert", alertsRoute);
//
//app.listen config - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
var port = process.env.PORT || 3000
app.listen(port, function () {
  console.log("To view your app, open this link in your browser: http://localhost:" + port);
});
