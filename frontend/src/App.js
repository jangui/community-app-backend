import React, { Component } from 'react';
import { BrowserRouter as Router, Route, Switch, Redirect } from 'react-router-dom';
import logo from './logo.svg';
import './App.css';
import LandingPage from './LandingPage'

function App() {
    return (
        <><Router>
            <Switch>
                <Route exact path="/" component={ (props) => (
                    <LandingPage  {...props}/>
                )}/>
            </Switch>
      </Router></>
  );
}

export default App;
