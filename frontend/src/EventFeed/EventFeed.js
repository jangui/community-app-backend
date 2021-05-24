import { withStyles } from '@material-ui/core';
import React, { Component } from 'react';
import EventPreview from './EventPreview';
import Navbar from './Navbar';

const styles = theme => ({
  main: {
    'width': '100%',
    'height': '100%',
    'display': 'flex',
    'flex-direction': 'column',
    'align-items': 'center-start',
    'justify-content': 'space-between',
    'font-family': '"Sanchez"',
  },
  spacer: {
    'height': '100px',
    'width': '100%',
    'flex-shrink': '0',
  },
});

class EventFeed extends Component {

  render() {
    const { classes } = this.props;

    return (
      <div className={classes.main}>
        <Navbar />
        <EventPreview />
        <EventPreview />
        <EventPreview />
      </div>
    );
  }
}

export default withStyles(styles)(EventFeed);
