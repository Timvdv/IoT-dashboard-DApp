import React, { Component } from "react";
import { Container, Grid, Header } from "semantic-ui-react";
import { Link } from "react-router-dom";

class MetamaskError extends Component {
  constructor(props) {
    super(props);

    this.state = {};
  }

  render() {
    return (
      <Container text>
        {" "}
        <Header textAlign="center"> Please connect to Metamask </Header>{" "}
      </Container>
    );
  }
}

export default MetamaskError;
