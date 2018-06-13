import React, { Component } from "react";
import { Container, Grid, Header, Step, Divider } from "semantic-ui-react";
import { Link } from "react-router-dom";

class NoDevices extends Component {
  constructor(props) {
    super(props);

    this.state = {};

    /**
     * Show steps to enter new devices when none are present
     */
    this.steps = [
      {
        key: "add",
        icon: "plus",
        title: "Add device",
        description: "By clicking the plus button"
      },
      {
        key: "fill",
        icon: "write",
        title: "Enter credentials",
        description: "Enter name, key (found in the device app) and password"
      },
      {
        key: "confirm",
        icon: "coffee",
        title: "Some patience",
        description: "Wait for the blockchain to process the device"
      }
    ];
  }

  render() {
    return (
      <Container>
        {/* <Header textAlign="left"> You don't have any devices </Header>{" "} */}
        <Step.Group items={this.steps} size="small" />
      </Container>
    );
  }
}

export default NoDevices;
