import React, { Component } from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import Modal from 'react-modal';
import copy from 'copy-to-clipboard';
import Clip from './icons/clipboard';
import Doc from './Doc';
import swarm from './p2p/swarm';

import './App.css';

const customStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)'
  }
};

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
    return (
      <div className="App">
        <Modal
          isOpen={this.state.modalIsOpen}
          onRequestClose={this.closeModal}
          style={customStyles}
          contentLabel="Set your username"
          shouldCloseOnOverlayClick={false}
          shouldCloseOnEsc={false}
          data={{
            background: 'green'
          }}
        >
          <form onSubmit={this.closeModal}>
            <legend>Set your username</legend>
            <input type="text" onChange={this.saveUsername} required />
            <button type="submit">Enter</button>
          </form>
        </Modal>
        <Router>
          {!modalIsOpen && commReady ? (
            <Route
              path="/"
              render={props => {
                return (
                  <>
                    <header className="App-header">
                      Caracara{' '}
                      <span role="img" aria-label="caracara bird using a emoji">
                        🐧
                      </span>
                      <span className="App-username">
                        {this.state.username
                          ? `${this.state.username} is online`
                          : ''}
                      </span>
                      <div>
                        <span>
                          {this.comm && this.comm.db.key
                            ? `Draft: ${this.comm.db.key.toString('hex')}`
                            : ''}
                        </span>
                        <span onClick={this.copy} className="App-icon-clip">
                          <Clip />
                        </span>
                      </div>
                    </header>
                    <Doc
                      username={this.state.username}
                      comm={this.comm}
                      draftId={this.draftId}
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

Modal.setAppElement('#root');

export default App;
