const express = require("express");
const FitbitApiClient = require("fitbit-node");
const router = express.Router();
const request = require("request");

const cred = require("../credentials.json");

let client = new FitbitApiClient(cred.fitbit);

const scope = "activity heartrate profile sleep weight";

const redirectUrl = "http://localhost:8080/fitbit/accessToken";
//   "https://sleepy-eyrie-82836.herokuapp.com/fitbit/accessToken";

let auth_url = client.getAuthorizeUrl(scope, redirectUrl);

let token;

router.get("/auth_url", (req, res) => {
  logger.verbose(`Sending AUTH_URL to client`);
  res.send({
    auth_url
  });
});

router.get("/accessToken", async (req, res) => {
  try {
    logger.verbose(`Requesting access token from fitbit`);
    token = await client.getAccessToken(req.query.code, redirectUrl);
    res.send("<h1>You may close this tab now</h1>");
  } catch (err) {
    logger.error(`An error occurred while requesting token from fitbit`);
    logger.error(err);
    res.status(500);
    res.send("An error occured");
  }
});

router.get("/getToken", (req, res) => {
  logger.verbose('Sending token to client');
  if (token) {
    res.send(token);
    token=null;
  }
  else
    res.send({
      msg: "Token not available"
    });
});

// router.get('/heartRate', async (req, res) => {
//     let response = await client.get('/activities/heart/date/today/1d.json', req.query.token, '-');
//     console.log(response);
//     res.send(response);
// });

router.post("/refreshToken", async (req, res) => {
  logger.verbose('Requesting refresh token');

  let auth = Buffer.from(
    `${cred.fitbit.clientId}:${cred.fitbit.clientSecret}`
  ).toString("base64");

  request
    .post(
      {
        url: `https://api.fitbit.com/oauth2/token`,
        form: {
          refresh_token: req.body.refreshToken,
          grant_type: "refresh_token"
        }
      },
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${auth}`
        }
      },(err,resp,body)=>{
        if(err){
          logger.error('An error occured trying to refresh token');
          logger.error(err);
        }else(resp)=>{
          //TODO: NEED TO FIGURE THIS SHIT OUT
        }
      }
    );
  
  /**
   * ABOVE IS CUSTOM BY YOURS TRULY
   * FOLLOWING IS USING THE SHITTY FITBIT-NODE LIBRARY WHICH DOESN'T WORK BECAUSE OF WHICH THE ABOVE WAS NECESSARY
   */

  // try {
  //   let data = await client.refreshAccessToken(
  //     req.body.accessToken,
  //     req.body.refreshToken
  //   );
  //   console.log(data);
  //   res.send(data);
  // } catch (err) {
  //   console.log(err);
  //   res.status(500);
  //   res.send("An error occured");
  // }
});

/**
 * TODO: ADD OPTION TO SPECIFY DATE FOR REQUESTING SLEEP DATAS
 */
router.get("/sleep", async (req, res) => {
  logger.verbose('Requesting sleep data');
  try {
    let response = await client.get(
      `/sleep/date/${req.query.date}.json`,
      req.query.token,
      "-"
    );
    console.log(response);
    res.send(response);
  } catch (err) {
    logger.error(`An error occurred while requesting sleep data`);
    logger.error(err);
    res.status(500);
    res.send("An error occured");
  }
});

module.exports = router;
