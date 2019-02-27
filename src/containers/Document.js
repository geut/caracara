import React, { Component } from 'react';
import Automerge from 'automerge';
import CopyToClipboard from 'react-copy-to-clipboard';
import classNames from 'classnames';

import AppBar from '@material-ui/core/AppBar';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import Drawer from '@material-ui/core/Drawer';
import Divider from '@material-ui/core/Divider';
import IconButton from '@material-ui/core/IconButton';
import MenuIcon from '@material-ui/icons/Menu';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Tooltip from '@material-ui/core/Tooltip';
import { withStyles } from '@material-ui/core/styles';

import FileCopy from '@material-ui/icons/FileCopy';

import DiffMatchPatch from 'diff-match-patch';
import tinydate from 'tinydate';

import Collaborators from '../components/Collaborators';
import Editor from '../components/Editor';
import History from '../components/History';
import Layout from '../components/Layout';
import { withSwarm } from '../p2p/swarm';

const drawerWidth = 300;

const styles = theme => ({
  root: {
    flex: 1,
    display: 'flex'
  },
  editor: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: theme.palette.background.paper
  },
  title: {
    margin: `${theme.spacing.unit}px ${theme.spacing.unit * 4}px 0 ${theme
      .spacing.unit * 2}px`
  },
  items: {
    overflow: 'auto',
    flex: 1
  },
  layoutExtraIcons: {
    display: 'inline-flex'
  },
  tabHeader: {
    backgroundColor: theme.palette.grey[200]
  },
  asideBar: {
    zIndex: theme.zIndex.drawer + 1,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen
    })
  },
  asideBarShift: {
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen
    })
  },
  hide: {
    display: 'none'
  },
  drawer: {
    width: drawerWidth,
    flexShrink: 0
  },
  drawerContent: {
    overflow: 'hidden',
    backgroundColor: theme.palette.grey[200],
    borderLeft: `1px solid ${theme.palette.grey[500]}`,
    maxWidth: `${drawerWidth}px`,
    '& > header': {
      height: '100%'
    }
  },
  drawerOpen: {
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen
    })
  },
  drawerClose: {
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen
    }),
    overflowX: 'hidden',
    width: theme.spacing.unit * 7 + 1,
    [theme.breakpoints.up('sm')]: {
      width: theme.spacing.unit * 9 + 1
    }
  },
  drawerHeader: {
    display: 'flex',
    alignItems: 'center',
    ...theme.mixins.toolbar,
    justifyContent: 'flex-start'
  },
  content: {
    flexGrow: 1,
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen
    })
  },
  contentShift: {
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen
    }),
    marginRight: 0
  }
});

const stamp = tinydate('{HH}:{mm}:{ss}');

class Document extends Component {
  state = {
    attachedEvents: false,
    peerValue: {},
    text: '',
    localHistory: [],
    collaborators: new Set(),
    swarmReady: false,
    tabValue: 0,
    openDrawer: false
  };

  dmp = new DiffMatchPatch();
  original = undefined;

  static getDerivedStateFromProps({ swarm }) {
    if (swarm !== null) {
      return {
        swarmReady: true
      };
    }
    return null;
  }

  componentDidMount() {
    const { swarm } = this.props;
    if (!swarm) return;

    if (this.state.attachedEvents) return;

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

    this.setState({ attachedEvents: true });
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
            historyMessage = `${username} added (${changeText}) - ${stamp(
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
            historyMessage = `${username} removed (${changeText}) - ${stamp(
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

  sharedLink = () => {
    const { swarm } = this.props;
    const { protocol, host, pathname } = window.location;
    return `${protocol}//${host}${pathname}#/${swarm.db.key.toString('hex')}`;
  };

  handleDrawerOpen = () => {
    this.setState({ openDrawer: true });
  };

  handleDrawerClose = () => {
    this.setState({ openDrawer: false });
  };

  render() {
    const { classes, username, hasDraftId } = this.props;
    const {
      attachedEvents,
      tabValue,
      localHistory,
      collaborators,
      openDrawer
    } = this.state;
    return (
      <Layout
        username={username}
        titleBar={
          attachedEvents && (
            <div className={classes.layoutExtraIcons}>
              <CopyToClipboard text={this.sharedLink()}>
                <Tooltip title="Share your Doc">
                  <IconButton disabled={!attachedEvents} color="inherit">
                    <FileCopy />
                  </IconButton>
                </Tooltip>
              </CopyToClipboard>
              <IconButton
                color="inherit"
                aria-label="Open drawer"
                onClick={this.handleDrawerOpen}
                className={classNames({
                  [classes.hide]: this.state.openDrawer
                })}
              >
                <MenuIcon />
              </IconButton>
            </div>
          )
        }
      >
        {attachedEvents && (
          <div
            className={classNames(classes.root, classes.content, {
              [classes.contentShift]: openDrawer
            })}
          >
            <div className={classes.editor}>
              <Editor
                text={this.state.text}
                updatePeerValue={this.updatePeerValue}
                isAuthor={!hasDraftId}
              />
            </div>
            <aside>
              <Drawer
                variant="persistent"
                anchor="right"
                open={openDrawer}
                elevation={0}
                classes={{ paper: classes.drawerContent }}
                className={classNames(classes.drawer, {
                  [classes.drawerOpen]: this.state.open,
                  [classes.drawerClose]: !this.state.open
                })}
              >
                <div className={classes.drawerHeader}>
                  <IconButton onClick={this.handleDrawerClose}>
                    {!openDrawer ? <ChevronLeftIcon /> : <ChevronRightIcon />}
                  </IconButton>
                </div>
                <Divider />
                <AppBar
                  position="static"
                  classes={{ root: classes.tabHeader }}
                  className={classNames({
                    [classes.asideBarShift]: this.state.open
                  })}
                  elevation={0}
                >
                  <Tabs
                    value={tabValue}
                    onChange={this.handleTabChange}
                    textColor="primary"
                    indicatorColor="primary"
                  >
                    <Tab label="History" />
                    <Tab label="Collaborators" />
                  </Tabs>
                  {tabValue === 0 && (
                    <History history={localHistory} classes={classes} />
                  )}
                  {tabValue === 1 && (
                    <Collaborators
                      users={Array.from(collaborators)}
                      classes={classes}
                    />
                  )}
                </AppBar>
              </Drawer>
            </aside>
          </div>
        )}
      </Layout>
    );
  }
}

export default withSwarm(withStyles(styles)(Document));
