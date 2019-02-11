import React, { Component } from 'react';
import MarkdownPreview from './Editor';
import Automerge from 'automerge';
const DiffMatchPatch = require('diff-match-patch');

const tinydate = require('tinydate').default;
const stamp = tinydate('{HH}:{mm}:{ss}');

class Doc extends Component {
  constructor() {
    super();
    this.state = {
      peerValue: {},
      text: '',
      localHistory: []
    };

    // save doc in localStorage
    // Note(dk): add support for reading an old doc, or better to select the doc to use :)
    this.original = undefined;
    this.dmp = new DiffMatchPatch();
  }

  async componentDidMount() {
    this.props.comm.on('message', data => {
      const { username, message } = data;
      if (username === this.props.username) return;
      console.log('INCOMING MESSAGE');
      console.log('new message arrival from:', username);
      console.log('new message arrival content:', message);
      if (message.peerValue.length === 0) return;
      let newDoc;
      if (!this.doc) {
        newDoc = Automerge.applyChanges(Automerge.init(), message.peerValue);
      } else {
        newDoc = Automerge.applyChanges(this.doc, message.peerValue); // peerValue are automerge changes
      }
      if (message.original) {
        this.original = message.original;
      }
      this.doc = newDoc;
      this.setState({
        text: newDoc.text.join(''),
        localHistory: [...this.state.localHistory, message.diff]
      });
    });
  }

  componentWillUnmount() {
    this.props.comm.removeAllListeners('message');
  }

  updatePeerValue = val => {
    const { comm, username } = this.props;
    const { text } = val;

    // NOTE(dk): this portion should run only once on the creator doc. I choose to use a combination of a
    // local value as a safeguard and something that should be unique for the creator... but I'm not sure
    // of the last one.
    if (!this.original && comm.db.local.secretKey) {
      console.log('ORIGINAL COPY');
      this.doc = Automerge.change(Automerge.init(), 'doc:creation', doc => {
        doc.text = new Automerge.Text();
      });
      const creationChange = Automerge.getChanges(Automerge.init(), this.doc);
      this.original = true;

      comm.writeMessage({
        peerValue: creationChange,
        username,
        original: this.original,
        diff: [`${username} created the doc - ${stamp(new Date(Date.now()))}`]
      });
    }

    /***************************** Update text using diff_main ********/
    const diff = this.dmp.diff_main(this.state.text, text);

    this.dmp.diff_cleanupSemantic(diff);
    const patches = this.dmp.patch_make(this.state.text, diff);

    const updateAutomerge = (baseDoc, message, opFn) => {
      return Automerge.change(baseDoc, message, doc => {
        opFn(doc);
      });
    };

    patches.forEach(patch => {
      let idx = patch.start1;
      let historyMessage = '';
      let newDoc;
      patch.diffs.forEach(([operation, changeText]) => {
        switch (operation) {
          case 1: // Insertion
            historyMessage = `${username} added some text (${changeText}) - ${stamp(
              new Date(Date.now())
            )}`;
            newDoc = updateAutomerge(this.doc, historyMessage, doc => {
              console.log(`inserting text ${changeText.split('')} at ${idx}`);
              doc.text.insertAt(idx, ...changeText.split(''));
            });
            idx += changeText.length;
            break;
          case 0: // No Change
            idx += changeText.length;
            newDoc = null;
            break;
          case -1: // Deletion
            historyMessage = `${username} removed some text (${changeText}) - ${stamp(
              new Date(Date.now())
            )}`;
            newDoc = updateAutomerge(this.doc, historyMessage, doc => {
              for (let i = 0; i < changeText.length; i++) {
                console.log('removing text at pos', idx);
                doc.text.deleteAt(idx);
              }
              return doc;
            });
            break;
          default:
            break;
        }
        if (newDoc) {
          const changes = Automerge.getChanges(this.doc, newDoc);
          this.doc = newDoc;
          this.setState(
            {
              text,
              localHistory: [...this.state.localHistory, changes[0].message]
            },
            () => {
              console.log('>>> this.doc text', this.doc.text.join(''));
              // NOTE(dk): here we are sharing changes we made locally with our peers.
              comm.writeMessage({
                peerValue: changes,
                username,
                diff: changes[0].message
              });
            }
          );
        }
      });
    });
  };

  render() {
    return (
      <>
        <div className="App-editor">
          <MarkdownPreview
            text={this.state.text}
            updatePeerValue={this.updatePeerValue}
          />
        </div>
        <aside className="App-history">
          History:
          <ul>
            {[...this.state.localHistory].reverse().map((h, i) => (
              <li key={`history-${i}`}>{h}</li>
            ))}
          </ul>
        </aside>
      </>
    );
  }
}

export default Doc;
