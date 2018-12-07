/**
 * http://www.apache.org/licenses/LICENSE-2.0
 * @author: Christoph Schäbel
 */

function randomString(length) {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (var i = 0; i < length; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  return text;
}

var websocketclient = {

  'connect': function () {

    // reading whatever was input in the form 
    var host = 'broker.mqttdashboard.com';
    var port = 8000;
    var clientId = randomString(10);
    var username = '';
    var password = '';
    var keepAlive = 60;
    var lwQos = 1;
    var ssl = false;

    this.client = new Messaging.Client(host, port, clientId);
    this.client.onConnectionLost = this.onConnectionLost;

    var options = {
      timeout: 3,
      keepAliveInterval: keepAlive,
      useSSL: ssl,
      onSuccess: this.onConnect,
      onFailure: this.onFail
    };

    this.client.connect(options);
  },

  'onConnect': function () {
    websocketclient.connected = true;
    console.log("connected");
  },

  'onFail': function (message) {
    websocketclient.connected = false;
    console.log("error: " + message.errorMessage);
    websocketclient.render.showError('Connect failed: ' + message.errorMessage);
  },

  'onConnectionLost': function (responseObject) {
    websocketclient.connected = false;
    if (responseObject.errorCode !== 0) {
      console.log("onConnectionLost:" + responseObject.errorMessage);
    }

    //Cleanup messages
    websocketclient.messages = [];
    websocketclient.render.clearMessages();
  },

  'disconnect': function () {
    console.log("disconnected");
    this.client.disconnect();
  },

  'publish': function (topic, payload, qos, retain) {

    if (!websocketclient.connected) {
      websocketclient.render.showError("Not connected");
      return false;
    }

    var message = new Messaging.Message(payload);
    message.destinationName = topic;
    message.qos = qos;
    message.retained = retain;
    this.client.send(message);
    console.log('published: ' + payload.toString());
  }
};
