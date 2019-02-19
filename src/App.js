import React, { Component } from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';
// Material-UI
import Modal from '@material-ui/core/Modal';
import { withStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Fab from '@material-ui/core/Fab';
import FileCopy from '@material-ui/icons/FileCopy';
import 'typeface-roboto';

import withRoot from './withRoot';

import copy from 'copy-to-clipboard';
//import Clip from './icons/clipboard';
import Doc from './Doc';
import swarm from './p2p/swarm';
import Username from './Username';

const styles = theme => ({
  root: {
    display: 'flex',
    flexFlow: 'row wrap',
    /* The remaining place (horizontaly) will be spread out around divs in wrapper. */
    justifyContent: 'space-around',
    backgroundColor: theme.palette.grey[200]
  },
  modal: {
    textAlign: 'center',
    paddingTop: theme.spacing.unit * 20
  },
  paper: {
    position: 'absolute',
    width: theme.spacing.unit * 50,
    backgroundColor: theme.palette.background.paper,
    boxShadow: theme.shadows[5],
    padding: theme.spacing.unit * 4,
    outline: 'none'
  },
  grow: {
    flexGrow: 1
  },
  fab: {
    margin: theme.spacing.unit
  },
  toolbar: {
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  editor: {
    flex: '1 0 30%',
    height: '100vh'
  },
  history: {
    flex: '0 0 25%'
  },
  textField: {
    marginLeft: theme.spacing.unit,
    marginRight: theme.spacing.unit,
    display: 'flex'
  },
  title: {
    margin: `${theme.spacing.unit}px ${theme.spacing.unit * 4}px 0 ${theme
      .spacing.unit * 2}px`
  },
  historyItems: {
    maxHeight: '50vh',
    overflow: 'auto'
  },
  icon: {
    fontSize: 24
  }
});

class App extends Component {
  constructor() {
    super();

    this.comm = null;
    this.state = {
      commReady: false,
      modalIsOpen: true,
      username: ''
    };

    this.url = window.location.protocol + '//' + window.location.host;
    this.params = new URLSearchParams(window.location.search);
    this.draftId = this.params.get('draft');
  }

  saveUsername = e => {
    const { target } = e;
    this.setState({ username: target.value });
  };

  closeModal = () => {
    this.setState({ modalIsOpen: false });
  };

  async componentDidUpdate(prevProps, prevState) {
    const { modalIsOpen, username } = this.state;

    if (prevState.modalIsOpen && !modalIsOpen && username) {
      // username has been set
      this.comm = await swarm(username, this.draftId);
      this.setState({
        commReady: true
      });
    }
  }

  copy = e => {
    e.preventDefault();
    copy(`${this.url}?draft=${this.comm.db.key.toString('hex')}`);
  };

  render(props) {
    const { modalIsOpen, commReady } = this.state;
    const { classes } = this.props;

    return (
      <div className={classes.root}>
        <Modal open={this.state.modalIsOpen} disableEscapeKeyDown={true}>
          <Username
            classes={classes.paper}
            closeModal={this.closeModal}
            saveUsername={this.saveUsername}
          />
        </Modal>
        <Router>
          {!modalIsOpen && commReady ? (
            <Route
              path="/"
              render={props => {
                return (
                  <>
                    <AppBar position="static">
                      <Toolbar className={classes.toolbar}>
                        <Typography variant="h5" color="inherit">
                          Caracara &nbsp;
                          <span
                            role="img"
                            aria-label="caracara bird using a emoji"
                          >
                            🐧
                          </span>
                        </Typography>
                        <Typography align="center" variant="h6" noWrap={true}>
                          {this.state.username
                            ? `Welcome, ${this.state.username}!`
                            : ''}
                        </Typography>
                        <Fab
                          color="secondary"
                          onClick={this.copy}
                          aria-label="Share your doc"
                          className={classes.fab}
                          size="medium"
                        >
                          <FileCopy className={classes.icon} />
                        </Fab>
                      </Toolbar>
                    </AppBar>
                    <Doc
                      username={this.state.username}
                      comm={this.comm}
                      draftId={this.draftId}
                      classes={classes}
                    />
                  </>
                );
              }}
            />
          ) : null}
        </Router>
      </div>
    );
  }
}

export default withRoot(withStyles(styles)(App));
