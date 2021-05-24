import { withStyles } from '@material-ui/core';
import React, { Component } from 'react';

const styles = theme => ({
  main: {
    'margin-left': '50px',
    'width': '80%',
    'height': '10%',
    'display': 'flex',
    'flex-direction': 'row',
    'align-items': 'center',
    'justify-content': 'space-between',
    'font-family': '"Sanchez"',
  },
  spacer: {
    'height': '100px',
    'width': '100%',
    'flex-shrink': '0',
  },
  filter: {
    'font-size': '16px',
  },
});

class Navbar extends Component {

  render() {
    const { classes } = this.props;

    return (
      <div className={classes.main}>
        <h1> Events </h1>
        <h1 className={classes.filter}> filter by: city </h1>
      </div>
    );
  }
}

export default withStyles(styles)(Navbar);
