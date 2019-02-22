import React, { Component } from 'react';

import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  root: {
    height: '100vh',
    width: '100vw',
    display: 'flex',
    flexDirection: 'column'
  },
  toolbar: {
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  content: {
    flex: 1,
    display: 'flex'
  }
});

class Layout extends Component {
  render() {
    const { classes, username, titleBar, children } = this.props;
    return (
      <div className={classes.root}>
        <AppBar position="static">
          <Toolbar className={classes.toolbar}>
            <Typography variant="h6" color="inherit">
              Caracara &nbsp;
              <span role="img" aria-label="caracara bird using an emoji">
                🐧
              </span>
            </Typography>
            <Typography align="center" variant="h6" color="inherit">
              {username ? `Welcome, ${username}!` : ''}
            </Typography>
            {titleBar}
          </Toolbar>
        </AppBar>
        <div className={classes.content}>{children}</div>
      </div>
    );
  }
}

export default withStyles(styles)(Layout);
