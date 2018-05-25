import React, { Component } from "react";
import { Container, Button, Menu } from "semantic-ui-react";
import { Link, NavLink } from "react-router-dom";
import { withRouter } from "react-router-dom";

class Header extends Component {
  constructor(props) {
    super(props);
    this.state = {
      version: localStorage.getItem("iot_dashboard_version") || "1"
    };
  }

  render() {
    console.log(this.props.location.pathname);
    return (
      <header>
        <Container>
          <Menu secondary className={this.state.menuColorClass}>
            <NavLink exact to="/" name="home" className="logo">
              Decentralized IOT Dashboard
            </NavLink>

            <Menu.Menu position="right">
              <div className={this.state.version === "1" ? "" : "hide"}>
                <Menu.Item to="/about" as={Link} name="about" />
                <Menu.Item to="/faq" as={Link} name="faq" />
                <Button
                  to="/login"
                  as={Link}
                  primary
                  className={
                    this.props.location.pathname === "/dashboard" ? "hide" : ""
                  }
                >
                  Log in
                </Button>
              </div>
            </Menu.Menu>
          </Menu>
        </Container>
      </header>
    );
  }
}

export default withRouter(Header);
