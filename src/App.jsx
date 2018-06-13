import React, { Component } from "react";
import Web3 from "web3";
import { EthereumProvider } from "react-ethereum-provider";
import promisify from "util.promisify";
import { BrowserRouter as Router, Route } from "react-router-dom";

import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Footer from "./components/Footer";

import "./App.css";

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      loading: false,
      menuColorClass: "",
      activeItem: "Home"
    };
  }

  componentWillMount() {
    if (window.location.pathname === "/") {
      this.state.menuColorClass = "white";
    }

    this.setState({ menuColorClass: this.state.menuColorClass });
  }

  render() {
    // Loading
    if (this.state.loading) return <p>loading...</p>;

    // Done
    return (
      <Router>
        <div>
          <Route exact path="/" component={Home} />

          <Route
            path="/dashboard"
            render={() => (
              <EthereumProvider web3={Web3}>
                <Dashboard />
              </EthereumProvider>
            )}
          />

          <Footer />
        </div>
      </Router>
    );
  }
}

export default App;
