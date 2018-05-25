import { default as Web3 } from "web3";
import Promise, { promisifyAll } from "bluebird";

export const getWeb3Async = reload =>
  new Promise((resolve, reject) => {
    let web3 = window.web3;

    if (typeof web3 !== "undefined") {
      // Injected Web3 detected. Use Mist/MetaMask's provider.
      web3 = new Web3(web3.currentProvider);
      console.log("Metamask Loaded");
    } else {
      // No web3 instance injected, using Local web3.
      const provider = new Web3.providers.HttpProvider(
        "https://ropsten.infura.io/OApj7cQ66nRpHf7HaK5F"
      );
      web3 = new Web3(provider);
    }

    // wrap callback functions with promises
    promisifyAll(web3.eth, { suffix: "Async" });
    // promisifyAll(web3.net, { suffix: "Async" });
    // promisifyAll(web3.version, { suffix: "Async" });

    resolve(web3);
  });
