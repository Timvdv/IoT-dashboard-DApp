var path = require("path");
var Web3 = require("web3");
var keyStore = require("eth-lightwallet");
var jsonfile = require("jsonfile");
var abi = require("./DeviceContractAbi");
var file = "privatekey.json";
var device = require("./device.js");

var device_id = null;

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

  jsonfile.readFile(file, function (err, obj) {
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

      jsonfile.writeFile(file, obj, function (err) {
        if (!err) {
          console.log("New privatekey.json file written");
          connectToContract(obj);
        } else {
          console.error("Something went wrong while writing file", err);
        }
      });
    } else {
      console.log(`Your address: ${obj.address}`);
      console.log(`Private key: `, obj.privatekey);
      connectToContract(obj);
    }
  });
}

/**
 * Now we have the wallet.
 * Watch for events on the blockchain
 */
function connectToContract(wallet) {
  // Initialize the smart contract
  var contract = new this.web3.eth.Contract(
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
      for (let i = 0; i < events.length; i++) {
        var eventObj = events[i];
        console.log(
          `Created: ${eventObj.returnValues.name}`,
          eventObj.returnValues
        );
        if (eventObj.returnValues.device === wallet.address) {
          device_id = eventObj.returnValues.tokenId;
          console.log("Found my device ID from history", device_id);
        }
      }
    }
  );

  /**
   * When a device is created, it will emit a created function.
   * We use this to listen and save the tokenId
   */
  contract.events.DeviceCreated(function (error, result) {
    if (!error) {
      if (result.returnValues.device === wallet.address) {
        device_id = result.returnValues.tokenId;
        console.log("Found my device ID", device_id);
      }
    } else {
      console.log("Something went wrong, could not find created event");
    }
  });

  /**
   * When a device gets triggered
   * This function will make sure to send the correct response
   */
  contract.events.Trigger(function (error, result) {
    if (!error) {
      if (device_id) {
        if (result.returnValues.tokenId === device_id) {
          if (parseInt(result.returnValues.state, 10) === 1) {
            device.lightsOn();
          } else {
            device.lightsOff();
          }
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

/**
 * Now we have the wallet.
 * Watch for events on the blockchain
 */
function watchForEvents(wallet) { }

// Start reading from stdin so we don't exit.
process.stdin.resume();
