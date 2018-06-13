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
  Loader,
  Popup
} from "semantic-ui-react";
import { Link } from "react-router-dom";
import { withEthereum } from "react-ethereum-provider";
import Utils from "web3-utils";
import Featured from "../components/Featured";
import abi from "../DeviceContractAbi";
import MetamaskError from "../components/MetamaskError";
import NoDevices from "../components/NoDevices";
import AppHeader from "../components/Header";

/**
 * Dashboard
 * @constructor
 * @param {Object} props - The properties of the components
 */
class addDevice extends Component {
  constructor(props) {
    super(props);

    this.state = {
      deviceName: "",
      deviceAddress: "",
      deviceModalOpen: false,
      addingDevice: false,
      error: false,
      addDeviceMessage: "",
      version: localStorage.getItem("iot_dashboard_version") || "1",
      delay: 300,
      result: '',
      isOpen: false
    };

    this.contract = props.contract;
    this.coinbase = props.coinbase;

    this.handleScan.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    this.contract = nextProps.contract;
    this.coinbase = nextProps.coinbase;
  }

  popupOpen() {
    this.setState({ isOpen: true })
  }

  popupClose() {
    this.setState({ isOpen: false })
  }

  /**
   * Handle scanning of QR code
   * @param {} data 
   */
  handleScan(data) {
    if (data) {
      console.log(data);
      this.setState({
        deviceAddress: data,
      })

      this.popupClose();
    }
  }

  /**
   * Log the error when QR code scan fails
   * @param {*} err 
   */
  handleError(err) {
    console.error(err)
  }

  /**
   * User clicked add device button
   */
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
    this.props.getDevices();

    this.setState({ deviceModalOpen: false, addingDevice: false });
  }

  /**
   * Close the modal
   */
  closeModal() {
    this.setState({ deviceModalOpen: false });
    this.popupClose();
    console.log("get deviecs");
    this.props.getDevices();
  }

  /**
   * Open the modal
   */
  openModal() {
    this.setState({ deviceModalOpen: true });
  }

  /**
   * Handle name input chance
   */
  handleChangeDeviceName(event) {
    this.setState({ deviceName: event.target.value });
  }

  /**
   * Handle device input chance
   */
  handleChangeDeviceAddress(event) {
    this.setState({ deviceAddress: event.target.value });
  }

  /**
   * Render component
   */
  render() {
    return (
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
              <Modal.Header>
                <Icon name="plus" /> Add new device
                    </Modal.Header>
              <Modal.Content image>
                <Dimmer active={this.state.addingDevice}>
                  <Loader />
                </Dimmer>
                <Modal.Description>
                  <Message
                    hidden={!this.state.addDeviceMessage.length}
                    negative
                  >
                    {this.state.addDeviceMessage}
                  </Message>
                  <Form>
                    <label className="label-add-device"> <strong>
                      What will you call this device? (Can be anything)</strong>
                    </label>            <br />
                    <Form.Input
                      fluid
                      placeholder="Device name"
                      value={this.state.deviceName}
                      onChange={e => this.handleChangeDeviceName(e)}
                    />
                    <label className="label-add-device"> <strong>
                      Device address (Can be found on the device app) </strong>
                    </label> <br />
                    <Input fluid iconPosition='left' placeholder='Device address' onChange={e => this.handleChangeDeviceAddress(e)} value={this.state.deviceAddress}>
                      <Popup
                        on='click'
                        hideOnScroll
                        trigger={<Icon name='camera' inverted circular link />}
                        content={<div className="scanner"><QrReader delay={this.state.delay} onError={this.handleError} onScan={(data) => this.handleScan(data)} style={{ width: '100%' }} /></div>}
                        open={this.state.isOpen}
                        onClose={() => this.popupClose()}
                        onOpen={() => this.popupOpen()}
                      />
                      <input />
                    </Input><br />
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
    );
  }
}

export default addDevice;
