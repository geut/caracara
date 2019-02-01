import React, { Component } from 'react';
import copy from 'copy-to-clipboard';
import MarkdownPreview from './Editor';
import Clip from './icons/clipboard';

class Doc extends Component {
  constructor() {
    super();
    this.state = {
      peerValue: {
        text: ''
      },
      localHistory: []
    }
    this.url = window.location.protocol + '//' + window.location.host
  }

  async componentDidMount() {
    this.props.comm.on('message', data => {
      console.log('new message arrival from:', data.username)
      console.log('new message arrival content:', data.message)
      console.log('message history:', data.history)
      this.setState({
        peerValue: data.message.peerValue,
        localHistory: [ ...this.state.localHistory, data.history[0] ]});
    })
  }

  updatePeerValue = val => {
    const { comm, username } = this.props;
    this.setState({ peerValue: val }, () => {
      comm.writeMessage({ peerValue: val, username });
    });
  }

  copy = e => {
    e.preventDefault();
    copy(`${this.url}?draft=${this.props.comm.db.key.toString('hex')}`)
  }

  render() {
    const { username, comm } = this.props;
    return (
      <>
        <header className="App-header">
          Caracara <span role="img" aria-label="caracara bird using a emoji">🐧</span>
          <span className="App-username">{username ? `${username} is online` : ''}</span>
          <div>
            <span>
              {comm && comm.db.key ? `Draft: ${comm.db.key.toString('hex')}` : ''}
            </span>
            <span onClick={this.copy} className="App-icon-clip"><Clip /></span>
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

export default Doc;
