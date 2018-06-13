import React, { Component } from "react";
import { Container, Grid, Header, Image } from "semantic-ui-react";
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
        <Header textAlign="center"> Please connect to Metamask </Header> <hr />
        <Image
          src="https://github.com/MetaMask/faq/blob/master/images/download-metamask.png?raw=true"
          as="a"
          href="https://metamask.io/"
          target="_blank"
        />
      </Container>
    );
  }
}

export default MetamaskError;
