import React, { Component } from 'react';
import { BrowserRouter as Router, Route, Link } from "react-router-dom";
import Modal from 'react-modal';

// P2P stuff
import ram from 'random-access-memory';
import swarm from '@geut/discovery-swarm-webrtc';
import signalhub from 'signalhubws';
import Saga from './p2p/core';
import config from './p2p/config';

// internal components
import MarkdownPreview from './Editor';
import './App.css';

// P2P DEFAULTS
const webrtcOpts = {
  config: {
    iceServers: (process.env.ICE_URLS || config.ICE_URLS).split(';').map(data => {
      const [urls, credential, username] = data.split(',')

      if (credential && username) {
        return {
          urls,
          credential,
          username
        }
      }

      return { urls }
    })
  }
};

// END P2P DEFAULTS

const initComm = async (username, key) => {
  const publicKey = key && key.length > 0 ? key : null;
  //username = Date.now().toString();
  const saga = Saga(ram, publicKey, username);

  await saga.initialize();

  const sw = swarm({
    id: username,
    stream: () => {
      return saga.replicate()
    }
  });


  const discoveryKey = saga.db.discoveryKey.toString('hex');
  const signalUrls = (process.env.SIGNAL_URLS || config.SIGNAL_URLS).split(';');
  sw.join(signalhub(discoveryKey, signalUrls), webrtcOpts);

  sw.on('connection', async peer => {
    try {
      await saga.connect(peer);
    } catch (err) {
      console.log(err);
    }
  })

  return saga;
}

const customStyles = {
  content : {
    top                   : '50%',
    left                  : '50%',
    right                 : 'auto',
    bottom                : 'auto',
    marginRight           : '-50%',
    transform             : 'translate(-50%, -50%)'
  }
};

class MdDoc extends Component {
  constructor() {
    super();
    this.comm = null;
    this.state = {
      peerValue: {
        text: ''
      },
      localHistory: []
    }
  }

  async componentDidUpdate(prevProps, prevState) {
    const { username, draftId } = this.props;
    if (username !== prevProps.username) {
      // username has been set
      this.comm = await initComm(username, draftId);
      // connect the listener
      this.comm.on('message', data => {
        console.log('new message arrival from:', data.username)
        console.log('new message arrival content:', data.message)
        console.log('message history:', data.history)
        //if (this.props.username !== data.username){
        this.setState({ peerValue: data.message.peerValue, localHistory: [ ...this.state.localHistory, data.history[0] ]});
        //}
      })
    }
  }

  updatePeerValue = val => {
    console.log('updatePeerValue', val)
    this.setState({ peerValue: val }, () => {
      this.comm.writeMessage({ peerValue: val, username: this.props.username });
    });
  }

  componentWillUnmount() {
    this.comm.removeAllListeners('message')
  }

  render() {
    const { username, draftId } = this.props;
    return (
      <>
        <header className="App-header">
          Caracara <span role="img" aria-label="caracara bird using a emoji">🐧</span>
          <span className="App-username">{username ? `${username} is online` : ''}</span>
          <div>
              {this.comm && this.comm.db.key ? `Draft: ${this.comm.db.key.toString('hex')}` : ''}
          </div>
        </header>
        <div className="App-editor">
          <MarkdownPreview peerValue={this.state.peerValue} updatePeerValue={this.updatePeerValue}/>
        </div>
        <aside className="App-history">
          History:
          <ul>
              {this.state.localHistory.reverse().map(h => <li>{h[0]}</li>)}
          </ul>
        </aside>
      </>
    )
  }
}

class App extends Component {
  constructor() {
    super();

    this.state = {
      modalIsOpen: true,
      username: ''
    };

    this.openModal = this.openModal.bind(this);
    this.afterOpenModal = this.afterOpenModal.bind(this);
    this.closeModal = this.closeModal.bind(this);
    this.params = new URLSearchParams(window.location.search);

    this.draftId = this.params.get('draft');
  }

  openModal() {
    this.setState({modalIsOpen: true});
  }

  afterOpenModal() {
    // references are now sync'd and can be accessed.
  }

  saveUsername = (e) => {
    const { target } = e;
    this.setState({ username: target.value });
  }

  closeModal() {
    this.setState({modalIsOpen: false});
  }

  render(props) {
    return (
      <div className="App">
        <Modal
          isOpen={this.state.modalIsOpen}
          onAfterOpen={this.afterOpenModal}
          onRequestClose={this.closeModal}
          style={customStyles}
          contentLabel="Set your username"
        >
          <form>
            <legend>Set your username</legend>
            <input type="text" onChange={this.saveUsername}/>
          </form>
          <button onClick={this.closeModal}>Enter</button>
        </Modal>
        <Router>
          <Route path="/" render={props => {
            return <MdDoc username={this.state.username} draftId={this.draftId} />
          }} />
        </Router>
      </div>
    );
  }
}

export default App;
