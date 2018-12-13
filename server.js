//
//Middleware - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const express = require("express");
const app = express();
var cors = require('cors');
const bodyParser = require('body-parser')
var cookieParser = require('cookie-parser');
var session = require('express-session');
//
app.set('port', process.env.PORT || 2500);
app.use(cors());
app.use(express.static(__dirname));
// app.use(session({secret: 'ssshhhhh'}));
app.use(
  session({
    secret: "shhhh",
    cookie: {
      maxAge: 60000
    },
    // resave: false,
    // saveUninitialized: true
  })
);
//

//Routes - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
app.get('/isLoggedIn', (req, res) => {
  resObj = {
    isLoggedIn: req.session.loggedIn ? true : false,
  }
  console.log(resObj);
  // res.send('wooo');
  res.end(JSON.stringify(resObj));
})




app.get('/about', (req, res) => {
  res.sendFile(__dirname + '/views/browser-console/about.html');
})
app.get('/alerts', (req, res) => {
  // console.log(req.session);
  if (req.session.loggedIn) {
    res.sendFile(__dirname + '/views/browser-console/alerts.html');
    // next(); // allow the next route to run
  } else {
    // require the user to log in
    res.redirect("/login"); // or render a form, etc.
  }

  // if (req.session.loggedIn) {
  //   res.sendFile(__dirname + '/views/browser-console/alerts.html');
  // } else {
  //   res.sendFile(__dirname + '/views/browser-console/login.html');
  // }
})
app.get('/login', (req, res) => {
  res.sendFile(__dirname + '/views/browser-console/login.html');
})
app.get('/signup', (req, res) => {
  res.sendFile(__dirname + '/views/browser-console/signup.html');
})
app.get('/', (req, res) => {
  if (req.session.loggedIn) {
    res.sendFile(__dirname + '/views/browser-console/alerts.html');
    // next(); // allow the next route to run
  } else {
    // require the user to log in
    res.redirect("/login"); // or render a form, etc.
  }
})

const usersRoute = require("./routes/user");
const alertsRoute = require("./routes/alert");
const dangerZonesRoute = require("./routes/danger-zone");
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
app.use(dangerZonesRoute);
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

//1234