import React, { Component } from 'react';

import withOfflineState from 'react-offline-hoc';

import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import OfflineBolt from '@material-ui/icons/OfflineBolt';
import Tooltip from '@material-ui/core/Tooltip';
import IconButton from '@material-ui/core/IconButton';
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
  },
  icons: {
    display: 'inline-flex'
  }
});

const OfflineIndicator = () => (
  <Tooltip title="You are offline">
    <IconButton color="inherit">
      <OfflineBolt />
    </IconButton>
  </Tooltip>
);

class Layout extends Component {
  state = {
    swarmReady: false
  };

  // async componentDidMount() {
  //   const { username, match } = this.props;
  //   const swarm = await initComm(username, match.params.draftId);
  //   this.setState({
  //     swarmReady: true,
  //     swarm
  //   });
  // }

  render() {
    const { classes, username, titleBar, children, isOnline } = this.props;
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
            <div className={classes.icons}>
              {!isOnline ? OfflineIndicator() : ''}
              {titleBar}
            </div>
          </Toolbar>
        </AppBar>
        <div className={classes.content}>{children}</div>
      </div>
    );
  }
}

export default withOfflineState(withStyles(styles)(Layout));
