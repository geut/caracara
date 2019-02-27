import Saga from '@geut/saga';
import config from './config';
import ram from 'random-access-memory';
import swarm from '@geut/discovery-swarm-webrtc';
import signalhub from 'signalhubws';

import React, { Component } from 'react';

// P2P DEFAULTS
const webrtcOpts = {
  config: {
    iceServers: (process.env.ICE_URLS || config.ICE_URLS)
      .split(';')
      .map(data => {
        const [urls, credential, username] = data.split(',');

        if (credential && username) {
          return {
            urls,
            credential,
            username
          };
        }

        return { urls };
      })
  }
};
// END P2P DEFAULTS

const initComm = async (username, key) => {
  const publicKey = key && key.length > 0 ? key : null;
  const saga = Saga(ram, publicKey, username);

  await saga.initialize();

  const sw = swarm({
    id: username,
    stream: () => {
      return saga.replicate();
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
  });

  return saga;
};

export default initComm;

const SwarmContext = React.createContext(null);

class SwarmProvider extends Component {
  state = {
    swarmReady: false
  };

  async componentDidMount() {
    const { username, match: { params: { draftId = null } } = {} } = this.props;
    const swarm = await initComm(username, draftId);

    this.setState({
      swarm,
      swarmReady: true,
      hasDraftId: !!draftId
    });
  }

  render() {
    const { swarmReady, swarm, hasDraftId } = this.state;
    const { children } = this.props;
    return swarmReady ? (
      <SwarmContext.Provider value={{ swarm, hasDraftId }}>
        {children}
      </SwarmContext.Provider>
    ) : null;
  }
}

const withSwarm = WrappedComponent => {
  return class extends Component {
    static displayName = `WithSwarm${WrappedComponent.displayName}`;

    render() {
      return (
        <SwarmContext.Consumer>
          {({ swarm, hasDraftId }) => (
            <WrappedComponent
              {...this.props}
              swarm={swarm}
              hasDraftId={hasDraftId}
            />
          )}
        </SwarmContext.Consumer>
      );
    }
  };
};

export { SwarmProvider, withSwarm };
