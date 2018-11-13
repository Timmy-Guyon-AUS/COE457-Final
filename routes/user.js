const express = require("express");
const router = express.Router();
const crypto = require("crypto");

const passport = require("passport");

const User = require("../models/userModel");
const Token = require("../models/TokenModel");

isLoggedIn = (req, res, next) => {
  logger.verbose(`Checking if user already logged in`);
  if (req.isAuthenticated()) return next();
  else if (req.query.token) return next();
  res.send("login");
};

router.post(
  "/login",
  passport.authenticate("local", {
    failureRedirect: "/user/userexist"
  }),
  (req, res) => {
    logger.verbose(`Logging User in`);
    logger.verbose(`Generating token`);
    let token = crypto.randomBytes(64).toString("base64");
    Token.findOneAndUpdate(
      {
        username: req._passport.session.user || req.query.username
      },
      {
        token: token
      },
      {
        upsert: true
      },
      (err, doc, resp) => {
        if (!err && doc) {
          res.send({
            token
          });
        } else if (err) {
          logger.error(`An error occured while storing token in db`);
          logger.error(err);
          res.status(500);
          res.send({
            msg: "Internal error"
          });
        }
      }
    );
  }
);

router.get("/userexist", (req, res) => {
  res.send({
    msg: "CheckIfUserExists"
  });
});

router.get("/validateToken", isLoggedIn, (req, res) => {
  logger.verbose(`Validating token sent by client`);
  Token.findOne(
    {
      token: req.query.token
    },
    (err, resp) => {
      if (err) {
        logger.error(`An error occurred while retrieving token from db`);
        logger.error(err);
        res.status(500);
        res.send({
          msg: "Internal error"
        });
      } else if (resp) {
        res.send({
          token: resp.token
        });
      } else {
        res.send({
          status: "invalidToken",
          msg: "Token not found"
        });
      }
    }
  );
});

router.get("/logout", (req, res) => {
  req.logout();
  logger.verbose("Logging out user");
  Token.findOneAndDelete({
    username: req._passport.session.user
  }).exec();
  res.send("logout");
});

router.post("/signUp", (req, res) => {
  logger.verbose("Creating new user");
  User.register(
    new User({
      username: req.body.email,
      contactNo: req.body.mobile,
      gender: req.body.gender,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      age: req.body.age,
      address: req.body.address
    }),
    req.body.password
  ).then(
    data => {
      passport.authenticate("local")(req, res, () => {
        res.send({
          success: true
        });
      });
    },
    err => {
      logger.error("An error occured while creating a new user");
      logger.error(err);
      res.send(err);
    }
  );
});

router.get("/resetPassword", (req, res) => {
  res.send("toBeImplemented");
});

module.exports = router;
