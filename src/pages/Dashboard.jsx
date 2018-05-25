import React, { Component } from "react";
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

/**
 * Dashboard
 * @constructor
 * @param {Object} props - The properties of the components
 */
class Dashboard extends Component {
  constructor(props) {
    super(props);
    console.log(props);
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
      addDeviceMessage: "",
      version: localStorage.getItem("iot_dashboard_version") || "1"
    };

    this.connectToEthereum();

    this.contract = null;
    this.coinbase = null;
  }

  componentDidMount() {
    this.connectionInterval = setTimeout(
      this.connectToEthereum.bind(this),
      500
    );
  }

  connectToEthereum() {
    const connected = this.props.ethereum.connected;

    if (!this.props.ethereum.connected) {
      return;
    }

    this.setState({ connected });

    this.web3 = this.props.ethereum.connection.web3;

    this.startEthereum();
  }

  async startEthereum() {
    this.setState({
      error: false
    });

    if (!this.state.connected || this.props.ethereum.accounts.locked) {
      this.setState({
        error: true
      });

      return;
    }

    console.log(`clear interval, ${this.connectionInterval}`);
    window.clearInterval(parseInt(this.connectToEthereum));

    // Get some props
    const coinbase = await this.web3.eth.getCoinbase();

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

  renderAccounts() {
    return (
      <option value={this.state.coinbase} key={this.state.coinbase}>
        {this.state.coinbase}
      </option>
    );
  }

  showBalance(balance) {
    return balance && Utils.fromWei(balance.toString(), "ether");
  }

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
        //console.log(events);
        for (let i = 0; i < events.length; i++) {
          var eventObj = events[i];
          console.log(
            `Created: ${eventObj.returnValues.name}`,
            eventObj.returnValues
          );
        }
      }
    );
  }

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

  async addDevice() {
    this.setState({
      addDeviceMessage: ""
    });

    if (!this.state.deviceName || !this.state.deviceAddress) {
      this.setState({
        addDeviceMessage: "Please enter a device name / address"
      });
      return;
    }

    if (!this.contract) {
      return;
    }

    this.setState({ addingDevice: true });

    console.log(
      `Adding device: ${this.state.deviceName}, ${this.state.deviceAddress}`
    );

    try {
      await this.contract.methods
        .addDevice(this.state.deviceName, this.state.deviceAddress)
        .send({
          from: this.coinbase,
          gasPrice: 500000000000
        });
    } catch (e) {
      this.setState({
        addDeviceMessage: e.message,
        addingDevice: false
      });

      return;
    }

    // Update devices when device is added
    this.getDevices();

    this.setState({ deviceModalOpen: false, addingDevice: false });
  }

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
      console.log(removed);
    } catch (e) {
      console.log("Something went wrong: ", e.message);
    }
  }

  deviceIsLoading(id) {
    if (this.state.devices[parseInt(id) - 1]) {
      this.state.devices[parseInt(id) - 1].loading = true;

      this.setState({
        devices: this.state.devices
      });
    }
  }

  renderDevices() {
    return this.state.devices.map((device, key) => {
      return (
        <Card key={key}>
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
            <Card.Header>{device.deviceName}</Card.Header>
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

  closeModal() {
    this.setState({ deviceModalOpen: false });
  }

  openModal() {
    this.setState({ deviceModalOpen: true });
  }

  handleChangeDeviceName(event) {
    this.setState({ deviceName: event.target.value });
  }

  handleChangeDeviceAddress(event) {
    this.setState({ deviceAddress: event.target.value });
  }

  render() {
    if (this.state.error) {
      return <MetamaskError ethereum={this.props.ethereum} />;
    }

    return (
      <div>
        <Container>
          <Divider hidden />
          {this.state.devices.length === 0 ? <NoDevices /> : null}
        </Container>
        <br />
        <Container>
          <h1> Devices </h1>
          <Divider />

          <Card.Group>
            {this.renderDevices()}
            <Card className="device">
              <Card.Content>
                <Card.Description>
                  <Modal
                    trigger={
                      <Icon
                        name="add"
                        size="huge"
                        className="add-device"
                        onClick={() => {
                          this.openModal();
                        }}
                      />
                    }
                    open={this.state.deviceModalOpen}
                    onOpen={() => {
                      this.openModal();
                    }}
                    onClose={() => {
                      this.closeModal();
                    }}
                  >
                    <Modal.Header>Add new device</Modal.Header>
                    <Modal.Content image>
                      <Dimmer active={this.state.addingDevice}>
                        <Loader />
                      </Dimmer>
                      <Icon name="plus" /> <br />
                      <Modal.Description>
                        <Header>Device Settings</Header>
                        <Message
                          hidden={!this.state.addDeviceMessage.length}
                          negative
                        >
                          {this.state.addDeviceMessage}
                        </Message>
                        <Form>
                          <Divider hidden />
                          <Form.Input
                            fluid
                            label="Device name"
                            value={this.state.deviceName}
                            onChange={e => this.handleChangeDeviceName(e)}
                          />
                          <Form.Input
                            fluid
                            label="Device address (can be found on the device app)"
                            value={this.state.deviceAddress}
                            onChange={e => this.handleChangeDeviceAddress(e)}
                          />
                          <Button
                            onClick={() => this.addDevice()}
                            basic
                            primary
                            fluid
                          >
                            {" "}
                            Add{" "}
                          </Button>
                        </Form>
                      </Modal.Description>
                    </Modal.Content>
                  </Modal>
                </Card.Description>
              </Card.Content>
            </Card>
          </Card.Group>
        </Container>
      </div>
    );
  }
}

export default withEthereum()(Dashboard);
