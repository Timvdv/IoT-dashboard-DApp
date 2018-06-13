import React, { Component } from "react";
import { Container, Button, Menu, Dropdown } from "semantic-ui-react";
import { Link, NavLink } from "react-router-dom";
import { withRouter } from "react-router-dom";

class AppHeader extends Component {
  constructor(props) {
    super(props);

    const address = localStorage.getItem("eth_address");

    this.state = {
      isHome: this.props.home ? true : false,
      coinbase: "",
      options: [
        {
          key: 1,
          address: `Your address: ${address}`,
          value: 1
        }
      ]
    }

  }

  omponentWillReceiveProps(nextProps) {
    this.updateMenu(nextProps);
  }


  async updateMenu(props) {
    if (props.ethereum && props.ethereum.accounts) {
      console.log(props.ethereum.accounts);

      this.setState({
        options: [
          {
            key: 1,
            address: `Your address: ${props.ethereum.accounts.value && props.ethereum.accounts.value[0]}`,
            value: 1
          }
        ]
      });
    }
  }

  async componentDidMount() {
    if (this.props.ethereum && this.props.ethereum.connected) {

    }
  }

  render() {
    return (
      <header>
        <Container>
          <Menu secondary>
            <NavLink exact to="/" name="home" className="logo">
              Decentralized IOT Dashboard
            </NavLink>

            <Menu.Menu position="right" className={(this.state.isHome ? "hide" : null)}>
              <Dropdown
                text="Logged in with Metamask"
                options={this.state.options}
                simple
                item
              />
            </Menu.Menu>
          </Menu>
        </Container>
      </header>
    );
  }
}

export default withRouter(AppHeader);
