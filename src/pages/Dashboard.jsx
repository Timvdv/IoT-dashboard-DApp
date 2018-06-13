import React, { Component } from "react";
import QrReader from 'react-qr-reader'
import {
  Container,
  Grid,
  Segment,
  Header,
  Divider,
  Button,
  Icon,
  Form,
  Checkbox,
  Message,
  List,
  Card,
  Modal,
  Input,
  Dimmer,
  Loader
} from "semantic-ui-react";
import { Link } from "react-router-dom";
import { withEthereum } from "react-ethereum-provider";
import Utils from "web3-utils";
import Featured from "../components/Featured";
import abi from "../DeviceContractAbi";
import MetamaskError from "../components/MetamaskError";
import NoDevices from "../components/NoDevices";
import AppHeader from "../components/Header";
import AddDevice from "../components/AddDevice";

/**
 * Dashboard
 * @constructor
 * @param {Object} props - The properties of the components
 */
class Dashboard extends Component {
  constructor(props) {
    super(props);
    const connected = props.ethereum.connected;

    this.state = {
      connected,
      coinbase: "",
      statusText: "",
      accounts: [],
      devices: [],
      deviceName: "",
      deviceAddress: "",
      deviceModalOpen: false,
      addingDevice: false,
      error: false,
      loading: true,
      addDeviceMessage: "",
      version: localStorage.getItem("iot_dashboard_version") || "1",
      delay: 300,
      result: 'No result',
    };

    this.contract = null;
    this.coinbase = null;

    this.connectToEthereum();
  }

  /**
   * When dashboard shows, retry to connect to ethereum
   */
  componentDidMount() {
    this.connectToEthereum();

    this.connectionInterval = setTimeout(
      this.connectToEthereum.bind(this),
      300
    );
  }

  /**
   * Connect to ethereum and initalize blockchain functionality
   */
  connectToEthereum() {
    const connected = this.props.ethereum.connected;

    console.log(connected);

    if (!this.props.ethereum.connected) {
      this.setState({
        error: true,
        loading: false,
      })
      return;
    }

    this.setState({ connected });

    this.web3 = this.props.ethereum.connection.web3;

    console.log(this.web3);

    this.startEthereum();
  }

  /**
   * Initalize blockchain functionality
   */
  async startEthereum() {
    this.setState({
      error: false
    });

    if (!this.state.connected || this.props.ethereum.accounts.locked) {
      this.setState({
        error: true
      });

      return;
    } else {
      window.clearInterval(this.connectToEthereum);
      console.log(`clear interval, ${this.connectionInterval}`);
    }

    // Get some props
    const coinbase = await this.web3.eth.getCoinbase();

    console.log(coinbase);

    this.coinbase = coinbase;

    if (!coinbase) {
      console.log("no balance");
      return;
    }

    const balance = await this.getBalance(coinbase);

    // Get smart contract
    var contract = new this.web3.eth.Contract(
      abi,
      "0xe7765ae31676b7392ce7f10c3c0bd6e0d2c9b545"
    );

    this.contract = contract;

    this.getDevices();
    this.getCreatedEvents();

    this.setState({ loading: false, coinbase, balance });
  }

  /**
   * Get all device from contract
   */
  async getDevices() {
    if (!this.contract) {
      return;
    }

    const coinbase = await this.web3.eth.getCoinbase();

    const devices = await this.contract.methods.tokensOfOwner(coinbase).call();

    this.state.devices = [];

    // Load all device device by quering the blockchain
    await Promise.all(
      devices.map(async device => {
        const current_device = await this.contract.methods
          .getDevice(device)
          .call();

        current_device.deviceId = device;
        current_device.loading = false;

        this.state.devices.push(current_device);
      })
    );

    // Sort after all devices are loaded
    const devices_sorted = this.state.devices.sort((a, b) => {
      return parseInt(a.deviceId) > parseInt(b.deviceId);
    });

    this.setState({ devices: this.state.devices });
  }

  /**
   * Get balance from contract
   * @param {string} address 
   */
  getBalance(address) {
    return new Promise((resolve, reject) => {
      return this.web3.eth.getBalance(address, (error, result) => {
        if (!error) {
          resolve(result);
        } else {
          reject(error);
        }
      });
    });
  }

  /**
   * Show user balance
   * @param {float} balance 
   */
  showBalance(balance) {
    return balance && Utils.fromWei(balance.toString(), "ether");
  }

  /**
   * Search contract for created events
   */
  getCreatedEvents() {
    if (!this.contract) {
      return;
    }
    // Search the contract events for the hash in the event logs and show matching events.
    this.contract.getPastEvents(
      "DeviceCreated",
      {
        filter: { _from: this.coinbase },
        fromBlock: 0,
        toBlock: "latest"
      },
      (error, events) => {
        for (let i = 0; i < events.length; i++) {
          var eventObj = events[i];
          // console.log(
          //   `Created: ${eventObj.returnValues.name}`,
          //   eventObj.returnValues
          // );
        }
      }
    );
  }

  /**
   * Search contract for trigger events
   */
  getTriggerEvents() {
    if (!this.contract) {
      return;
    }

    // Search the contract events for the hash in the event logs and show matching events.
    this.contract.getPastEvents(
      "Trigger",
      {
        filter: { _from: this.coinbase },
        fromBlock: 0,
        toBlock: "latest"
      },
      (error, events) => {
        for (let i = 0; i < events.length; i++) {
          var eventObj = events[i];
          console.log(`Triggered: `, eventObj);
        }
      }
    );
  }

  /**
   * Trigger device with ID and state.
   * @param {object} device 
   */
  async trigger(id, state) {
    if (!this.contract) {
      return;
    }

    this.deviceIsLoading(id);

    try {
      const device = await this.contract.methods.tiggerDevice(id, state).send({
        from: this.coinbase,
        gasPrice: 500000000000
      });
    } catch (e) {
      console.log(e.message);
      this.setState({
        message: e.message
      });
    }

    // Update devices when device is added
    this.getDevices();
  }

  /**
   * Remove a device
   * @param {object} device 
   */
  async removeDevice(device) {
    if (!this.contract) {
      return;
    }

    this.deviceIsLoading(device.deviceId);

    try {
      const coinbase = await this.web3.eth.getCoinbase();

      const removed = await this.contract.methods
        .removeTokenFrom(coinbase, device.deviceId)
        .send({
          from: this.coinbase,
          gasPrice: 40000000000
        });

      // Update devices when device is added
      this.getDevices();
    } catch (e) {
      console.log("Something went wrong: ", e.message);

      // Update devices when something went wrong
      this.getDevices();
    }
  }

  /**
   * Set device to loading state
   * @param {string} id 
   */
  deviceIsLoading(id) {
    const device_to_load = this.getDeviceById(id);

    if (device_to_load && device_to_load.length !== -1) {
      device_to_load[0].loading = true;

      this.setState({
        devices: this.state.devices
      });
    }
  }

  /**
   * Get device by id from local devices
   * @param {string} id 
   */
  getDeviceById(id) {
    return this.state.devices.filter(device => {
      return device.deviceId === id;
    });
  }

  renderDevices() {
    return this.state.devices.map((device, key) => {
      return (
        <Card key={device.deviceId}>
          <Card.Content>
            <Dimmer active={device.loading} inverted>
              <Loader inverted />
            </Dimmer>
            <Icon.Group size="big">
              <Icon
                circular
                corner
                name="remove"
                onClick={e => this.removeDevice(device)}
              />
            </Icon.Group>
            <Card.Header title={device.tokenId}>
              {device.deviceName}
            </Card.Header>
            <Card.Meta>{device.deviceType}</Card.Meta>
          </Card.Content>
          <Card.Content extra>
            <div className="ui two buttons">
              <Button
                basic={parseInt(device.state) === 0}
                color="green"
                onClick={() => this.trigger(device.deviceId, 1)}
              >
                On
              </Button>
              <Button
                basic={parseInt(device.state) !== 0}
                color="red"
                onClick={() => this.trigger(device.deviceId, 0)}
              >
                Off
              </Button>
            </div>
          </Card.Content>
        </Card>
      );
    });
  }

  render() {
    if (this.state.error) {
      return (
        <div>
          <AppHeader ethereum={this.props.ethereum} />
          <Container>
            <Divider hidden />
            <MetamaskError ethereum={this.props.ethereum} />
          </Container>
        </div>
      );
    }

    return (
      <div>
        <AppHeader ethereum={this.props.ethereum} />
        <Container>
          <Divider hidden />
          {this.state.devices.length === 0 ? <NoDevices /> : null}
        </Container>
        <br />
        <Container>
          <h1> Devices </h1>
          <Divider />

          <Dimmer inverted active={this.state.loading} >
            <Loader />
          </Dimmer>

          <Card.Group >
            {this.renderDevices()}
            <AddDevice contract={this.contract} coinbase={this.coinbase} getDevices={this.getDevices.bind(this)} />
          </Card.Group>
        </Container>
      </div>
    );
  }
}

export default withEthereum()(Dashboard);
