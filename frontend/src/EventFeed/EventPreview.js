import { withStyles } from '@material-ui/core';
import React, { Component } from 'react';
import { Link } from 'react-router-dom';

const styles = theme => ({
  eventTitle: {
    'textDecorationLine': 'none',
    'font-family': '"Sanchez"',
    'color': '#daa520',
    "padding": '5px 10px',
    "fontSize": '18px',
    'margin-left': '5px',
    '&:hover': {
      'color': '#b08f26',
      'transition': '0.3s',
    },
  },
  main: {
    'width': '30%',
    'height': '20%',
    'display': 'flex',
    'flex-direction': 'column',
    'flex-wrap': 'none',
    'align-items': 'left',
  },
  post: {
    'height': '100%',
    'width': '100%',
    'display': 'flex',
    'justify-content': 'center',
    'margin-left': 'auto',
    'margin-right': 'auto',
    'flex-wrap': 'wrap',
  },
  footer: {
    'width': '50%',
    'display': 'flex',
    'flex-direction': 'column',
    'align-items': 'center',
    'margin': '0px 0px',
    'padding-bottom': '20px',
    'color': 'white',
    '& a': {
      'text-decoration': 'none',
      'color': 'pink',
      'transition': '0.3s',
      'padding': '5px 0px',
    },
    '& a:hover': {
      'color': 'purple',
    },
  },
  footer_flexbox: {
    'display': 'flex',
    'align-items': 'center',
    'justify-content': 'center',
  },
  image: {
    'height': '32px',
    'width': '32px',
    'padding-top': '5px',
    'padding': '0px 5px',
  },
  image_small: {
    'height': '16px',
    'width': '16px',
    'padding': '10px 5px',
  },
});

class EventPreview extends Component {
  state = {
    hasLoaded: false,
  };

  loadedTrigger = () => {
    this.setState({hasLoaded: true});
  }

  render() {
    const { classes } = this.props;

    /*
    // render post footer only after markdown has rendered
    let postFooter;
    if (this.state.hasLoaded) {
      postFooter = <PostFooter />
    }
    */

    return (
      <div className={classes.main}>
        <div className={classes.post}>
           <Link className={classes.eventTitle} to='/event'>Event Preview</Link>
        </div>
      </div>
    );
  }
}

export default withStyles(styles)(EventPreview);
