import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import CopyToClipboard from 'react-copy-to-clipboard';

import IconButton from '@material-ui/core/IconButton';
import Tooltip from '@material-ui/core/Tooltip';

import FileCopy from '@material-ui/icons/FileCopy';

import { SwarmContext } from '../p2p/swarm';

class TitleBar extends Component {
  static getDerivedStateFromProps({ swarm }) {
    if (swarm !== null) {
      return {
        swarmReady: true
      };
    }
    return null;
  }

  state = {
    swarmReady: false
  };

  sharedLink = () => {
    const { swarm } = this.props;
    return `${window.location.href}${swarm.db.key.toString('hex')}`;
  };
  render() {
    const { swarmReady } = this.state;
    return (
      <CopyToClipboard text={swarmReady && this.sharedLink()}>
        <Tooltip title="Share your Doc">
          <IconButton disabled={!swarmReady} color="inherit">
            <FileCopy />
          </IconButton>
        </Tooltip>
      </CopyToClipboard>
    );
  }
}

class ConnectedTitleBar extends Component {
  render() {
    return (
      <SwarmContext.Consumer>
        {swarm => <TitleBar {...this.props} swarm={swarm} />}
      </SwarmContext.Consumer>
    );
  }
}

export default ConnectedTitleBar;

/*
const SwarmTitleBar = withSwarm(TitleBar);
export default withRouter(
  ({ username, match: { params: { draftId } } = {} }) => (
    <SwarmTitleBar username={username} draftId={draftId} />
  )
);
*/
