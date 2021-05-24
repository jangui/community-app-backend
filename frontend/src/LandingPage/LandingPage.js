import { withStyles } from '@material-ui/core';
import React, { Component } from 'react';
import EventFeed from '../EventFeed';

const styles = theme => ({
  title: {
    'width': '100%',
    'height': '100%',
    'display': 'flex',
    'color': '#daa520',
    'font-size': '72px',
    'flex-direction': 'column',
    'align-items': 'center',
    'justify-content': 'top',
    'font-family': '"Sanchez"',
  },
  spacer: {
    'height': '20px',
    'width': '100%',
    'text-align': 'right',
    'flex-shrink': '0',
  },
});

class LandingPage extends Component {

  constructor(props) {
    super(props);

    this.state = {
      sidePanelOpen: false,
    };
  }

  componentDidMount() {
    window.scrollTo(0, 0);
  }

  sidePanelClickHandler = () => {
    this.setState( (prevState) => {
      return {sidePanelOpen: !prevState.sidePanelOpen}
    });
  };

  render() {
    const { classes } = this.props;
    /*
    let backDrop;

    if (this.state.sidePanelOpen) {
      backDrop = <BackDrop clickHandler={this.backDropClickHandler}/>;
    }
    */
    // yert

    return (
        <>
        <div className={classes.spacer}>Login</div>
        <div className={classes.title}>Maxime</div>
        <EventFeed />
        </>
    );
  }
}

export default withStyles(styles)(LandingPage);
