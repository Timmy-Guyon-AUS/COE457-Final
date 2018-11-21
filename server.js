//
//Middleware - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const express = require("express");
const app = express();
var cors = require('cors');
const bodyParser = require('body-parser')
const expressSession = require("express-session");
// var cookieParser = require('cookie-parser');
// var session = require('express-session');
//
app.set('port', process.env.PORT || 2500);
app.use(cors());
app.use(express.static(__dirname));
// app.use(session({secret: 'ssshhhhh'}));
//
//Routes - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
app.get('/', (req, res) => {
  console.log(req.session);
  res.sendFile(__dirname + './views/browser-console/tabs.html');
  // if (req.session.loggedIn) {
  //   res.sendFile(__dirname + './views/browser-console/tabs.html');
  // } else {
  //   res.sendFile(__dirname + './views/browser-console/login.html');
  // }
})
app.get('/views', (req,res) => {
  console.log(req.session);
  res.sendFile(__dirname + './views/browser-console/login.html');
  // if (!req.session.loggedIn) {
  //   res.sendFile(__dirname + './views/browser-console/login.html');
  // }
})
app.get('/about', (req, res) => {
  res.sendFile(__dirname + './views/browser-console/about.html');
})
app.get('/alerts', (req, res) => {
  res.sendFile(__dirname + './views/browser-console/alerts.html');
  // if (req.session.loggedIn) {
  //   res.sendFile(__dirname + './views/browser-console/alerts.html');
  // } else {
  //   res.sendFile(__dirname + './views/browser-console/login.html');
  // }
})
app.get('/login', (req, res) => {
  res.sendFile(__dirname + './views/browser-console/login.html');
})
app.get('/signup', (req, res) => {
  res.sendFile(__dirname + './views/browser-console/signup.html');
})
//
const usersRoute = require("./routes/user");
const alertsRoute = require("./routes/alert");
//
//MQTT Subscribers - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const alertSubscriber = require("./mqtt-clients/subscribers/alerts-subscriber.js");
const areaSubscriber = require("./mqtt-clients/subscribers/area-subscriber.js")
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
app.use("/user", usersRoute);
app.use("/alert", alertsRoute);
//
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

//app.listen config - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
app.listen(app.get('port'), function () {
  console.log('Express started on http://localhost:' +
    app.get('port') + '; press Ctrl-C to terminate.');
});

//Ikram's first change on the new repos