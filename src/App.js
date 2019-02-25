import React, { Component } from 'react';
import { HashRouter as Router, Switch, Route } from 'react-router-dom';

// Material-UI
import Modal from '@material-ui/core/Modal';
import { withStyles } from '@material-ui/core/styles';

import withRoot from './withRoot';
import ConnectedDocument from './containers/Document';
import Layout from './components/Layout';
import Username from './components/Username';

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
  icon: {
    fontSize: 24
  }
});

class App extends Component {
  comm = null;
  state = {
    commReady: false,
    modalIsOpen: true,
    modalError: false,
    username: ''
  };

  saveUsername = e => {
    const { target } = e;
    this.setState({ username: target.value, modalError: false });
  };

  closeModal = () => {
    const { username } = this.state;
    if (!username) {
      this.setState({ modalError: true });
      return;
    }
    this.setState({ modalIsOpen: false });
  };

  async componentDidUpdate(prevProps, prevState) {
    const { modalIsOpen, username } = this.state;

    if (prevState.modalIsOpen && !modalIsOpen && username) {
      // username has been set
      this.setState({
        commReady: true
      });
    }
  }

  render(props) {
    const { modalIsOpen, commReady, username, modalError } = this.state;
    const { classes } = this.props;

    return (
      <Router basename="https://caracara.hashbase.io">
        <div className={classes.root}>
          <Modal open={this.state.modalIsOpen} disableEscapeKeyDown={true}>
            <Username
              classes={classes.paper}
              closeModal={this.closeModal}
              onUsernameChange={this.saveUsername}
              error={modalError}
            />
          </Modal>
          {!modalIsOpen && commReady && (
            <Switch>
              <Route
                path="/:draftId?"
                render={props => {
                  return (
                    <Layout {...props} username={username}>
                      <ConnectedDocument username={username} />
                    </Layout>
                  );
                }}
              />
            </Switch>
          )}
        </div>
      </Router>
    );
  }
}

export default withRoot(withStyles(styles)(App));
