import React, { Component } from "react";
import { Container, Divider } from "semantic-ui-react";
import { Link } from "react-router-dom";

class Footer extends Component {
  constructor(props) {
    super(props);

    this.state = {};
  }

  render() {
    return (
      <footer id="contentinfo" className="body">
        <Divider hidden />
        <Container className="centered">
          <p>2018 - Flashboys - Tim van de Vathorst</p>
        </Container>
      </footer>
    );
  }
}

export default Footer;
