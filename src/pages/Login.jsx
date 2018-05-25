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
  List
} from "semantic-ui-react";
import { Link } from "react-router-dom";
import { withEthereum } from "react-ethereum-provider";
import Utils from "web3-utils";
import Featured from "../components/Featured";
import MetamaskError from "../components/MetamaskError";

/**
 * Tradiotional login page to test if users convert better
 * using methods they already know vs Metamask plugin
 * @constructor
 * @param {Object} props - The properties of the components
 */
class Login extends Component {
  constructor(props) {
    super(props);
    const connected = props.ethereum.connected;

    this.state = {
      connected,
      coinbase: "",
      statusText: "",
      accounts: [],
      error: false
    };

    // Connect to the ethereum network
    this.connectToEthereum();

    // When connection ends
    this.connectionInterval = setInterval(
      this.connectToEthereum.bind(this),
      4000
    );
  }

  /**
   * Connect to the Ethereum network
   */
  connectToEthereum() {
    const connected = this.props.ethereum.connected;

    if (!this.props.ethereum.connected) {
      return;
    }

    console.log(`clear interval, ${this.connectionInterval}`);
    window.clearInterval(parseInt(this.connectToEthereum));

    this.setState({ connected });

    this.web3 = this.props.ethereum.connection.web3;

    this.startEthereum();
  }

  /**
   * When an connection is established
   */
  async startEthereum() {
    this.setState({
      error: false
    });

    if (!this.state.connected) {
      this.setState({
        error: true
      });

      console.log("You need a web3 connection");
      return;
    }

    // Get some props
    const coinbase = await this.web3.eth.getCoinbase();

    // If you don't have a coinbase, something is wrong.
    if (!coinbase) {
      console.log("no balance");
      return;
    }

    const balance = await this.getBalance(coinbase);

    this.setState({ loading: false, coinbase, balance });
  }

  componentDidMount() {
    this.startEthereum();
  }

  /**
   * Get balance from wallet
   * @param {String} address
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
   * Render account dropdown
   */
  renderAccounts() {
    return (
      <option value={this.state.coinbase} key={this.state.coinbase}>
        {this.state.coinbase}
      </option>
    );
  }

  /**
   * Render show balance
   */
  showBalance(balance) {
    return balance && Utils.fromWei(balance.toString(), "ether");
  }

  /**
   * Render state
   */
  render() {
    if (this.state.error) {
      return <MetamaskError />;
    }

    return (
      <div>
        <Featured>
          <Header>Log in</Header>
          <Form onSubmit={this.handleSubmit}>
            <Form.Field label="Select account" control="select">
              {this.renderAccounts()}
            </Form.Field>
            <p>balance : {this.showBalance(this.state.balance) || "-"} ETH</p>
            <Button as={Link} to="/dashboard" inverted basic>
              Access dashboard
            </Button>
          </Form>
        </Featured>
        <Container text>
          <Divider hidden />
          Lorem ipsum dolor sit amet consectetur, adipisicing elit. Id et
          delectus rem doloribus mollitia neque ad voluptate magni porro
          pariatur.
        </Container>
      </div>
    );
  }
}

export default withEthereum()(Login);
