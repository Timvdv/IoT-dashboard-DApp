import React, { Component } from "react";
import { Container, Header, Divider, Button, Icon } from "semantic-ui-react";
import { Link, Redirect } from "react-router-dom";
import Featured from "../components/Featured";

/**
 * Homepage, this page shows information about the decentralized IoT dashboard
 */
class Home extends Component {
  constructor(props) {
    super(props);

    this.state = {
      version: localStorage.getItem("iot_dashboard_version") || "1"
    };
  }

  render() {
    // When the second version is active redirect to dashboard
    if (this.state.version === "2") {
      return <Redirect to="/dashboard" />;
    }

    return (
      <div>
        <Featured>
          <article>
            <h2>Maximum privacy</h2>
            <p>Control your devices without a middleman who is watching you</p>

            <Button basic size="large" className="white" to="/login" as={Link}>
              <Icon name="add user" />
              Create account
            </Button>
          </article>
        </Featured>
        <Container text>
          <Divider hidden />
          <section id="what" className="body">
            <Header as="h2" icon textAlign="center">
              <Icon name="lock" circular />
              <Header.Content>Secure</Header.Content>
            </Header>
            <p>
              Lorem ipsum dolor sit amet consectetur adipisicing elit.
              Perferendis, amet voluptate aliquid maxime cupiditate debitis,
              dignissimos fugiat, hic aut nesciunt nam cumque numquam tempora
              sed nobis beatae sit sint dolor consequatur. Aut est fugit magnam
              et recusandae voluptate! Expedita, amet.
            </p>
          </section>
        </Container>
      </div>
    );
  }
}

export default Home;
