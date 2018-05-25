import React, { Component } from "react";
import { Container, Grid } from "semantic-ui-react";
import { Link } from "react-router-dom";

class Featured extends Component {
  constructor(props) {
    super(props);

    this.state = {};
  }

  render() {
    return (
      <aside id="featured" className="body">
        <Container>
          <Grid columns="equal">
            <Grid.Column width={8}>{this.props.children}</Grid.Column>
          </Grid>
        </Container>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <polygon fill="white" points="0,100 100,0 100,100" />
        </svg>
      </aside>
    );
  }
}

export default Featured;
