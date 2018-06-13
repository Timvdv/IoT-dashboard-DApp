var path = require("path");
var Web3 = require("web3");
var keyStore = require("eth-lightwallet");
var jsonfile = require("jsonfile");
var abi = require("./DeviceContractAbi");
var file = "privatekey.json";
var device = require("./device.js");

// server.js
// load the things we need
var express = require("express");
var app = express();

// set the view engine to ejs
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));

// use res.render to load up an ejs view file

var contract;
var device_id = null;
var local_device = {
  returnValues: {}
};
var local_state = {
  returnValues: {}
};
var wallet = {};

// Make sure web3 is globally available
if (typeof web3 !== "undefined") {
  web3 = new Web3(web3.currentProvider);
} else {
  web3 = new Web3(
    new Web3.providers.WebsocketProvider("wss://ropsten.infura.io/ws")
  );
}

// Start program.
init();

/**
 * Create offline wallet, if present use existing wallet.
 */
function init() {
  device.init();

  jsonfile.readFile(file, function(err, obj) {
    console.log("reading file from storage");

    if (!obj) {
      console.log("No account found, creating new address");

      var account = web3.eth.accounts.create();

      console.log(`Your address: ${account.address}`);
      console.log(`Private key: ${account.privateKey}`);

      var obj = {
        address: account.address,
        privatekey: account.privateKey
      };

      jsonfile.writeFile(file, obj, function(err) {
        if (!err) {
          console.log("New privatekey.json file written");
          wallet = obj;
          connectToContract();
        } else {
          console.error("Something went wrong while writing file", err);
        }
      });
    } else {
      console.log(`Your address: ${obj.address}`);
      console.log(`Private key: `, obj.privatekey);
      wallet = obj;
      connectToContract();
    }
  });
}

/**
 * Now we have the wallet.
 * Watch for events on the blockchain
 */
function connectToContract() {
  // Initialize the smart contract
  contract = new this.web3.eth.Contract(
    abi,
    "0xe7765ae31676b7392ce7f10c3c0bd6e0d2c9b545"
  );

  /**
   * Search history for tokenId's associated with this wallet
   */
  contract.getPastEvents(
    "DeviceCreated",
    {
      // filter: { _from: this.coinbase },
      fromBlock: 0,
      toBlock: "latest"
    },
    (error, events) => {
      if (error) {
        console.log(error);
      }

      if (events) {
        for (let i = 0; i < events.length; i++) {
          var eventObj = events[i];
          // console.log(
          //   `Created: ${eventObj.returnValues.name}`,
          //   eventObj.returnValues
          // );
          if (eventObj.returnValues.device === wallet.address) {
            foundDevice(eventObj);
          }
        }
      }
    }
  );

  /**
   * When a device is created, it will emit a created function.
   * We use this to listen and save the tokenId
   */
  contract.events.DeviceCreated(function(error, result) {
    if (!error) {
      if (result.returnValues.device === wallet.address) {
        foundDevice(result);
      }
    } else {
      console.log("Something went wrong, could not find created event");
    }
  });

  /**
   * When a device gets triggered
   * This function will make sure to send the correct response
   */
  contract.events.Trigger(function(error, result) {
    if (!error) {
      if (device_id) {
        if (result.returnValues.tokenId === device_id) {
          if (parseInt(result.returnValues.state, 10) === 1) {
            device.lightsOn();
          } else {
            device.lightsOff();
          }

          foundDeviceState(result);
          console.log("Device state set to: ", result.returnValues.state);
        }
      } else {
        console.log("Device id not found");
      }
    } else {
      console.log("Something went wrong");
    }
  });
}

function foundDevice(device_object) {
  device_id = device_object.returnValues.tokenId;
  local_device = device_object;
  console.log("Found my device ID", device_id);

  contract.methods
    .getDevice(device_id)
    .call()
    .then(function(result) {
      foundDeviceState(result);
    });
}

function foundDeviceState(device_object) {
  local_state = device_object.returnValues || device_object;

  console.log("Found my device State", device_id);
}

/**
 * Now we have the wallet.
 * Watch for events on the blockchain
 */
function watchForEvents(wallet) {}

// index page
app.get("/", function(req, res) {
  console.log(local_device);
  res.render("pages/index", {
    wallet: wallet.address,
    device_id: device_id,
    device: local_device,
    device_state: local_state
  });
});

// index page
app.get("/test", function(req, res) {
  res.render("pages/tests");
});

// change color
app.get("/command/color/:r/:g/:b/:a", function(req, res) {
  if (req.params.r && req.params.g && req.params.b && req.params.a) {
    device.changeColor(req.params.r, req.params.g, req.params.b, req.params.a);
    res.json({ success: true });
  }
});

// enter command
app.get("/command/:action", function(req, res) {
  if (req.params.action === "on") {
    console.log("Turning on");
    device.lightsOn();
    res.json({ success: true });
  }
  if (req.params.action === "off") {
    console.log("Turning off");
    device.lightsOff();
    res.json({ success: true });
  }
  if (req.params.action === "rainbow") {
    console.log("Turning on rainbow");
    device.rainbow();
    res.json({ success: true });
  }
});

app.listen(8080);
console.log("8080 is the magic port");
