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
import { MicroRaiden } from "@raiden_network/microraiden";
import Cookies from "js-cookie";
import { Link } from "react-router-dom";
import Featured from "../components/Featured";
import { getWeb3Async } from "../services/web3Service";
import RaidenService from "../services/raidenService";

/**
 * Raiden is not used at the moment.
 */
class Login extends Component {
  constructor(props) {
    super(props);

    // you can set this variable in a new 'script' tag, for example
    window.uRaidenParams = {
      contract: Cookies.get("RDN-Contract-Address"),
      token: Cookies.get("RDN-Token-Address"),
      receiver: Cookies.get("RDN-Receiver-Address"),
      amount: Cookies.get("RDN-Price")
    };

    this.state = {
      statusText: "",
      accounts: [],
      amount: 0,
      remaining: 0,
      token: {},
      channels: [],
      channel_missing: false,
      to_channel: ""
    };

    this.raidenService = new RaidenService();

    this.topUpChannel.bind(this);
    this.changeAccount.bind(this);
  }

  async startEthereum() {
    // url (required), options (optional)
    fetch("http://raiden.timvandevathorst.nl/api/1/stats", {
      method: "get"
    })
      .then(response => response.json())
      .then(json => {
        console.log(json);
        var cnt = 20;

        console.log("test");
        console.log(Cookies.get("RDN-Insufficient-Confirmations"));

        // wait up to 20*200ms for web3 and call ready()
        var pollingId = setInterval(() => {
          if (Cookies.get("RDN-Insufficient-Confirmations")) {
            Cookies.remove("RDN-Insufficient-Confirmations");
            clearInterval(pollingId);
            this.setState({ statusText: "Waiting confirmations..." });

            console.log("Waiting for conformations");
            setTimeout(function() {
              window.location.reload();
            }, 5000);
          } else if (cnt <= 0 || window.web3) {
            clearInterval(pollingId);
            this.initRaiden(
              json["manager_abi"],
              json["token_abi"],
              json["sync_block"]
            );
          } else {
            --cnt;
          }
        }, 200);
      })
      .catch(err => {
        console.log(err);
        this.setState({ statusText: "Something went wrong." });
      });
  }

  initRaiden(contractABI, tokenABI, startBlock) {
    // you can set this variable in a new 'script' tag, for example
    window.uRaidenParams = {
      contract: Cookies.get("RDN-Contract-Address"),
      token: Cookies.get("RDN-Token-Address"),
      receiver: Cookies.get("RDN-Receiver-Address"),
      amount: Cookies.get("RDN-Price")
    };

    console.log("URAIDEN PARAMS:::");
    console.log(window.uRaidenParams);
    console.log(":::");
    /*
    * @param web3  Web3 http url, or object with currentProvider property
    * @param contractAddr  Channel manager contract address
    * @param contractABI  Channel manager ABI
    * @param tokenAddr  Token address, must be the same setup in channel manager
    * @param tokenABI  Token ABI
    */
    this.uraiden = new MicroRaiden(
      this.state.web3,
      window.uRaidenParams.contract,
      contractABI,
      window.uRaidenParams.token,
      tokenABI
    );

    this.refreshAccounts(true);
  }

  refreshAccounts(_autoSign) {
    let autoSign = !!_autoSign;

    this.setState({ accounts: [] });

    // use challenge period to assert configured channel
    // is valid in current provider's network
    this.uraiden
      .getChallengePeriod()
      .then(() => {
        return this.uraiden.getAccounts();
      })
      .then(async accounts => {
        if (!accounts || !accounts.length) {
          throw new Error("No account");
        }

        this.setState({ statusText: "Channel loading" });

        console.log(accounts);

        let accountList = [];

        accounts.forEach((value, key) => {
          accountList.push(value);
        });

        this.setState({ accounts: accountList });

        this.changeAccount(accountList[0]);

        const channel_info = await this.raidenService.getChannelInfo(
          accountList[0]
        );

        this.setState({ channels: channel_info });
      })
      .catch(err => {
        console.log(err);
        if (err.message && err.message.includes("account"))
          this.setState({
            statusText: "No accounts found, please connect to MetaMask"
          });
        else this.setState({ statusText: "Invalid conract" });
        // retry after 1s
        setTimeout(this.refreshAccounts.bind(this), 1000);
      });
  }

  createChannel() {
    let deposit = this.uraiden.num2tkn(this.state.amount);
    let account = this.state.accounts[0];

    this.setState({
      statusText: "Opening new channel"
    });

    const to_channel = this.state.to_channel.length
      ? this.state.to_channel
      : window.uRaidenParams.receiver;

    console.log("Opening channel with: ", to_channel);

    this.uraiden
      .openChannel(account, to_channel, deposit)
      .then(channel => {
        Cookies.remove("RDN-Nonexisting-Channel");
        this.refreshAccounts(true);
      })
      .catch(err => {
        console.error(err);
        this.setState({
          statusText: "An error ocurred trying to open a channel"
        });
        this.refreshAccounts();
      });
  }

  topUpChannel() {
    const deposit = this.uraiden.num2tkn(this.state.amount);

    this.setState({
      statusText: "Opening channel"
    });

    this.uraiden
      .topUpChannel(deposit)
      .then(() => {
        this.refreshAccounts(true);
      })
      .catch(err => {
        this.refreshAccounts();
        console.error(err);
        this.setState({
          statusText: "An error ocurred trying to deposit to channel"
        });
      });
  }

  changeAccount(account_value) {
    console.log(`Should be called on create?`);

    var account = account_value;

    console.log(`Account should have value: ${account}`);

    this.uraiden.loadStoredChannel(account, window.uRaidenParams.receiver);
    if (this.uraiden.isChannelValid() && Cookies.get("RDN-Balance-Signature")) {
      this.uraiden.verifyProof({
        balance: this.uraiden.web3.toBigNumber(
          Cookies.get("RDN-Sender-Balance")
        ),
        sig: Cookies.get("RDN-Balance-Signature")
      });
    }

    (this.uraiden.isChannelValid()
      ? Promise.reject(this.uraiden.channel)
      : this.uraiden.loadChannelFromBlockchain(
          account,
          window.uRaidenParams.receiver
        )
    )
      .then(
        () => {
          // resolved == loadFromBlockchain successful, retry page with balance=0
          this.signRetry(0);
          throw new Error("loadChannelFromBlockchain successful");
        },
        () => {
          // rejected == isChannelValid or loadChannelFromBlockchain didn't find anything,
          // continue normal loading, for channel creation
          return this.uraiden.getTokenInfo(account);
        }
      )
      .then(
        token => {
          console.log(`Got token`, token);

          this.setState({ token });
          // Todo token to DOM

          // $(".tkn-decimals").attr(
          //   "min",
          //   Math.pow(10, -token.decimals).toFixed(token.decimals)
          // );

          if (
            this.uraiden.isChannelValid() &&
            this.uraiden.channel.account === account_value &&
            this.uraiden.channel.receiver === window.uRaidenParams.receiver
          ) {
            return this.uraiden
              .getChannelInfo()
              .then(info => {
                if (Cookies.get("RDN-Nonexisting-Channel")) {
                  Cookies.remove("RDN-Nonexisting-Channel");
                  window.alert(
                    "Server won't accept this channel.\n" +
                      "Please, close+settle+forget, and open a new channel"
                  );
                  // $("#channel_present .channel_present_sign").attr(
                  //   "disabled",
                  //   true
                  // );
                  // autoSign = false;
                } else {
                  // $("#channel_present .channel_present_sign").attr(
                  //   "disabled",
                  //   false
                  // );

                  this.setState({
                    statusText: `channel is ${info.state}`
                  });
                }

                console.log("Channel ifno");
                console.log(info);
                return info;
              })
              .catch(err => {
                console.error(err);
                return { state: "error", deposit: this.uraiden.num2tkn(0) };
              })
              .then(info => {
                // $("#channel_present .on-state.on-state-" + info.state).show();
                // $(
                //   "#channel_present .on-state:not(.on-state-" + info.state + ")"
                // ).hide();

                var remaining = 0;
                if (
                  info.deposit.gt(0) &&
                  this.uraiden.channel &&
                  this.uraiden.channel.proof &&
                  this.uraiden.channel.proof.balance.isFinite()
                ) {
                  remaining = info.deposit.sub(
                    this.uraiden.channel.proof.balance
                  );
                }

                this.setState({ remaining: this.uraiden.tkn2num(remaining) });

                // $("#channel_present #channel_present_deposit").attr(
                //   "value",
                //   this.uraiden.tkn2num(info.deposit)
                // );
                // $(".btn-bar").show();

                // if (info.state === "opened") {
                //   $("#balance-column")
                //     .removeClass("col-sm-12")
                //     .addClass("col-sm-8");
                //   $("#topup-column").show();
                // } else {
                //   $("#balance-column")
                //     .removeClass("col-sm-8")
                //     .addClass("col-sm-12");
                //   $("#topup-column").hide();
                // }

                // if (info.state === "opened" && autoSign) {
                //   signRetry();
                // }
                // mainSwitch("#channel_present");
                this.setState({
                  statusText: "Channel present",
                  channel_missing: false
                });
              });
          } else {
            this.setState({
              statusText: "Channel missing",
              channel_missing: true
            });
          }
        },
        function(err) {
          console.error("Error getting token info", err);
          throw err;
        }
      );
  }

  signRetry(amount) {
    // autoSign = false;
    this.uraiden
      .incrementBalanceAndSign(
        !isNaN(amount) ? amount : window.uRaidenParams.amount
      )
      .then(proof => {
        // $(".channel_present_sign").removeClass("green-btn");
        console.log("SIGNED!", proof);
        Cookies.set("RDN-Sender-Address", this.uraiden.channel.account);
        Cookies.set("RDN-Open-Block", this.uraiden.channel.block);
        Cookies.set("RDN-Sender-Balance", proof.balance.toString());
        Cookies.set("RDN-Balance-Signature", proof.sig);
        Cookies.remove("RDN-Nonexisting-Channel");
        this.setState({
          statusText: "Channel Loading"
        });
        window.location.reload();
      })
      .catch(err => {
        if (err.message && err.message.includes("Insuficient funds")) {
          console.error(err);
          var current = err["current"];
          var missing = err["required"].sub(current);
          // $("#deposited").text(uraiden.tkn2num(current));
          // $("#required").text(uraiden.tkn2num(missing));
          // $("#remaining").text(
          //   uraiden.tkn2num(current.sub(uraiden.channel.proof.balance))
          // );
          this.setState({
            statusText: "Insuficient funds"
          });
        } else if (
          err.message &&
          err.message.includes("User denied message signature")
        ) {
          console.error(err);
          this.setState({
            statusText: "User denied message signature"
          });
          // $(".channel_present_sign").addClass("green-btn");
        } else {
          this.setState({
            statusText: "error occured"
          });
          console.error(err);
          // errorDialog("An error occurred trying to sign the transfer", err);
          this.refreshAccounts();
        }
      });
  }

  updateChannel(event) {
    this.state.to_channel = event.target.value;
  }

  buyTokens() {
    const account = this.state.accounts;

    if (account && account.length) {
      this.uraiden
        .buyToken(account[0])
        .then(this.refreshAccounts)
        .catch(err => {
          console.error(err);

          this.setState({
            statusText: "An error ocurred trying to buy tokens"
          });
        });
    }
  }

  renderAccounts() {
    return this.state.accounts.map(account => (
      <option value={account} key={account}>
        {account}
      </option>
    ));
  }

  async componentDidMount() {
    const web3 = await getWeb3Async();
    if (web3.currentProvider) {
      // const abi = await web3.eth.contract(ABIInterfaceArray);
      // const instance = instancePromisifier(abi.at(SMART_CONTRACT_INSTANCE));
      // console.log("Interface", ABIInterfaceArray);

      this.setState({ web3: web3, isWeb3synced: true });
    }

    this.startEthereum();
  }

  handleChange = (e, { name, value }) => this.setState({ [name]: value });

  handleSubmit() {
    const { amount } = this.state;
    this.setState({ amount });
  }

  renderChannels() {
    return this.state.channels.map(channel => {
      console.log(channel);
      // channel.create_transfer();
      return (
        <List.Item key={channel.open_block}>
          {" "}
          Channel: {channel.state} - {channel.open_block}
        </List.Item>
      );
    });
  }

  renderChannelButton() {
    if (this.state.channel_missing) {
      return (
        <Form.Button
          type="button"
          content="Create channel"
          onClick={() => this.createChannel()}
        />
      );
    }

    return (
      <Form.Button
        type="button"
        content="Top up"
        onClick={() => this.topUpChannel()}
      />
    );
  }

  render() {
    console.log(this.state.channels);
    return (
      <div>
        <Featured>
          <h1>Channels</h1>
          <List>{this.renderChannels()}</List>

          <h1>Log in</h1>
          <Message visible>{this.state.statusText}</Message>
          <Form onSubmit={this.handleSubmit}>
            <Form.Field
              label="Select account"
              control="select"
              onChange={e => this.changeAccount(this.state.accounts[0])}
            >
              {this.renderAccounts()}
            </Form.Field>
            <Form.Group label="Your token balance">
              <Form.Input
                placeholder="Amount"
                name="balance"
                disabled
                style={{ opacity: 1 }}
                value={
                  (this.state.token &&
                    this.state.token.balance &&
                    this.uraiden.tkn2num(this.state.token.balance) +
                      " " +
                      this.state.token.symbol) ||
                  ""
                }
              />
              <Form.Button
                type="button"
                content="Buy tokens"
                onClick={() => this.buyTokens()}
              />
            </Form.Group>
            <Form.Group label="Deposit tokens">
              <Form.Input
                placeholder="Amount"
                name="amount"
                value={this.state.amount}
                onChange={this.handleChange}
              />

              {this.renderChannelButton()}
            </Form.Group>
            <Divider />
            <Form.Group>
              <Form.Input
                placeholder="Channel address"
                name="toChannel"
                onChange={e => this.updateChannel(e)}
              />
              <Form.Button
                type="button"
                content="Create channel"
                onClick={() => this.createChannel()}
              />{" "}
            </Form.Group>
            remaining tokens: {this.state.remaining} <br />
            <Button type="submit">Submit</Button>
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

export default Login;
