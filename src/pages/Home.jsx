import React, { Component } from "react";
import { Container, Header, Divider, Button, Icon } from "semantic-ui-react";
import { Link, Redirect } from "react-router-dom";
import Featured from "../components/Featured";
import AppHeader from "../components/Header";

/**
 * Homepage, this page shows information about the decentralized IoT dashboard
 */
class Home extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div>
        <AppHeader home={true} />
        <Featured>
          <article>
            <h2>Maximum privacy</h2>
            <p>Control your devices without a middleman who is watching you.</p>

            <Button
              basic
              size="large"
              className="white"
              to="/dashboard"
              as={Link}
            >
              <Icon name="browser" />
              View dashboard
            </Button>
          </article>
        </Featured>
        <Container text>
          <Divider hidden />
          <section id="what" className="body">
            <Header as="h2" icon textAlign="center">
              <Icon name="lock" circular />
              <Header.Content>
                IoT privacy, security &amp; zero downtime
              </Header.Content>
            </Header>
            <p className="centered">
              By combining IoT and the blockchain we created a solution which
              tackels a lot of problems which currently exist in most IoT
              devices. The blockchain helps securing your devices, removes the
              middleman and make sure the services are up forever.{" "}
              <Link to="/dashboard"> View dashboard. </Link>
            </p>
          </section>
        </Container>
      </div>
    );
  }
}

export default Home;
