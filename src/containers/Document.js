import React, { Component } from 'react';
import Automerge from 'automerge';

import AppBar from '@material-ui/core/AppBar';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import { withStyles } from '@material-ui/core/styles';

import DiffMatchPatch from 'diff-match-patch';
import tinydate from 'tinydate';

import Editor from '../components/Editor';
import History from '../components/History';
import Collaborators from '../components/Collaborators';
import { SwarmContext } from '../p2p/swarm';

const styles = theme => ({
  root: {
    flex: 1,
    display: 'flex'
  },
  editor: {
    flex: 4,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: theme.palette.background.paper
  },
  title: {
    margin: `${theme.spacing.unit}px ${theme.spacing.unit * 4}px 0 ${theme
      .spacing.unit * 2}px`
  },
  aside: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    borderLeft: `1px solid ${theme.palette.grey[500]}`
  },
  items: {
    overflow: 'auto',
    flex: 1
  },
  tabHeader: {
    backgroundColor: theme.palette.grey[200]
  }
});

const stamp = tinydate('{HH}:{mm}:{ss}');

class Document extends Component {
  state = {
    peerValue: {},
    text: '',
    localHistory: [],
    collaborators: new Set(),
    swarmReady: false,
    tabValue: 0
  };

  dmp = new DiffMatchPatch();
  original = undefined;
  attachedEvents = false;

  static getDerivedStateFromProps({ swarm }) {
    if (swarm !== null) {
      return {
        swarmReady: true
      };
    }
    return null;
  }

  componentDidUpdate() {
    const { swarm } = this.props;
    if (!swarm) return;

    // Note(dk): dirty tweak :( Since swarm creation is async didMount did not help here :'(
    if (this.attachedEvents) return;

    swarm.on('join', data => {
      console.log('NEW COLLABORATOR', data);
      const { username } = data;
      this.setState(({ collaborators }) => ({
        collaborators: new Set(collaborators).add(username)
      }));
    });

    swarm.on('operation', data => {
      const { username, operation } = data;
      if (username === this.props.username) return;
      console.log('INCOMING OPERATION');
      console.log('new operation from:', username);
      console.log('new operation content:', operation);
      if (operation.peerValue.length === 0) return;
      let newDoc;
      if (!this.doc) {
        newDoc = Automerge.applyChanges(Automerge.init(), operation.peerValue);
      } else {
        newDoc = Automerge.applyChanges(this.doc, operation.peerValue); // peerValue are automerge changes
      }
      if (operation.original) {
        this.original = operation.original;
      }
      this.doc = newDoc;
      this.setState(prevState => ({
        text: newDoc.text.join(''),
        localHistory: [...this.state.localHistory, operation.diff]
      }));
    });
    this.attachedEvents = true;
  }

  componentWillUnmount() {
    const { swarm } = this.props;
    if (swarm !== null) swarm.removeAllListeners('operation');
  }

  updatePeerValue = val => {
    const { swarm, username } = this.props;
    const { text } = val;

    // NOTE(dk): this portion should run only once on the creator doc. I choose to use a combination of a
    // local value as a safeguard and something that should be unique for the creator... but I'm not sure
    // of the last one.
    if (!this.original && swarm.db.local.secretKey) {
      console.log('ORIGINAL COPY');
      this.doc = Automerge.change(Automerge.init(), 'doc:creation', doc => {
        doc.text = new Automerge.Text();
      });
      const creationChange = Automerge.getChanges(Automerge.init(), this.doc);
      this.original = true;

      swarm.writeOperation({
        peerValue: creationChange,
        username,
        original: this.original,
        diff: `${username} created the doc - ${stamp(new Date(Date.now()))}`
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
              console.log('SENDING OPERATION', changes);
              // NOTE(dk): here we are sharingwith our peers changes we have made locally.
              swarm.writeOperation({
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

  handleTabChange = (event, value) => {
    this.setState({ tabValue: value });
  };

  render() {
    const { classes, draftId } = this.props;
    const { swarmReady, tabValue, localHistory, collaborators } = this.state;

    return (
      swarmReady && (
        <div className={classes.root}>
          <div className={classes.editor}>
            <Editor
              text={this.state.text}
              updatePeerValue={this.updatePeerValue}
              isAuthor={!draftId}
            />
          </div>
          <aside className={classes.aside}>
            <AppBar position="static" classes={{ root: classes.tabHeader }}>
              <Tabs
                value={tabValue}
                onChange={this.handleTabChange}
                textColor="primary"
                indicatorColor="primary"
              >
                <Tab label="History" />
                <Tab label="Collaborators" />
              </Tabs>
            </AppBar>
            {tabValue === 0 && (
              <History history={localHistory} classes={classes} />
            )}
            {tabValue === 1 && (
              <Collaborators
                users={Array.from(collaborators)}
                classes={classes}
              />
            )}
          </aside>
        </div>
      )
    );
  }
}

//export default withStyles(styles)(Document);

class ConnectedDocument extends Component {
  render() {
    return (
      <SwarmContext.Consumer>
        {swarm => <Document {...this.props} swarm={swarm} />}
      </SwarmContext.Consumer>
    );
  }
}

export default withStyles(styles)(ConnectedDocument);

/*
//TODO(elmasse): Make it prettier.
export default withRouter(
  ({ username, match: { params: { draftId } } = {} }) => (
    <SwarmDocument username={username} draftId={draftId} />
  )
);
*/
