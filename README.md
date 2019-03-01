# CARACARA 🐧

> An experimental web app + `Dat` collaborative editor

## Preamble: The name

The [caracara](https://en.wikipedia.org/wiki/Southern_crested_caracara) is one of the birds that annually visit Tierra del Fuego.

## Contents
* [Development](#development)
* [Article](#article)

## Development

<details>
  <summary>Instructions for running caracara locally</summary>

### `npm start`

Runs the app in the development mode.<br>
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br>
You will also see any lint errors in the console.

> This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

### Signalhub

The app needs a signalhub server for connecting with other peers. Here we are using signalhubws which adds websocket support.

Run in a different terminal:
`npx signalhubws -p 4000`
</details>

## Article

### Caracara: React + Dat + Automerge
> Or how to create a simple collaborative editor on the distributed web

#### Introduction: The idea

Trying to combine, [again](https://github.com/geut/olaf), Dat with some
web development. The result will be a new experimental app, a mix between
two kingdoms. When you combine something like this (at first two different
worlds into one) the result does not mean to be the sum of all the
benefits or even cons: a complete new thing. Based on this, what can you expect
from a web app combined with Dat? You can [see it](https://caracara.hashbase.io/) for yourself.

In particular,
when we say web app we are talking about PWAs where offline support is
something that comes first and although it is not a key feature, it is common
in the decentralized world. The addition of Dat plays a part in the efficient
spreading of the content among peers.

All in all, we at [GEUT](https://github.com/geut) believe that it is
worth the effort of exploring these combinations.

#### Start

Remember, our goal is to create a simple collaborative text editor. This means, peer **A** writes some text, shares the copy with other peer, call it **B**, automatically authorizing **B** to be a new writer.

OK, let's start with the bootstrap of our web app. We are going to be using [React](https://reactjs.org/) for this matter. More specifically, `create-react-app` to make things more quickly.

`npx create-react-app caracara`

 After that,

 `cd caracara && npm start`

 Cool, the app is running locally now. We are going to add a new module called [`@geut/saga`](https://github.com/geut/saga). This will give P2P "powers" to our app. :sparkles:

 #### Saga

 `Saga` is a helper module developed by GEUT, that you can use to easily share operations between peers. You can think about this, like _applications chatting each other_. On top of this, we can do whatever we want with the operations. In this case, the meaning of the operation will be to _regenerate_ the document history in every peer. Since `saga` will help us to establish a connection and exchange messages with other peers we need to see how it works.

First, install the dependencies:

`npm install @geut/saga @geut/discovery-swarm-webrtc`

Now we need to create a connection, this will allow us to talk with a _swarm_ of peers:

This is an extract of [swarm.js](src/p2p/swarm.js)
```javascript
// saga requires:
//   - a [random-access-storage](https://github.com/random-access-storage) compatible module
//   - a public key
//   - and something that "identifies" the new Dat document
const saga = Saga(ram, publicKey, username);

// The initialization of saga is async. We are making sure hyperdb is ready.
await saga.initialize();

// Then, we create the swarm
const sw = swarm({
id: username,
  stream: () => {
    return saga.replicate();
  }
});

// Now we need to say that this peer want to joins the swarm.
sw.join(signalhub(discoveryKey, signalUrls), webrtcOpts);
// Have in mind we are using webrtc to connect with other peers.
// Webrtc requires a signalhub that is going to be used to discover other peers.
// It's only used at first and then the communication is between peers.
// Nevertheless, is a central point in our decentralized solution.
// We are using the Dat discoveryKey for this purpose.

sw.on('connection', async peer => {
  try {
    // Finally, when we connect with other peer we let saga knows about it
    await saga.connect(peer);
  } catch (err) {
    console.log(err);
  }
});
```

These are the important bits of the swarm creation. Now, let's see how we use this inside our app.

```javascript
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
```

```javascript
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
```

As you can see we have created a provider using the React Context API and also a `withSwarm` HOC for easy consuming using idiomatic React.

#### The editor

Great! We've just achieved the swarm creation phase and we have also shown how to connect `saga` with our app. Now it's time to start playing a bit with the editor.

There are two new important dependencies at this step:

`npm install automerge diff-match-patch`

For this part we are going to highlight the [Document.js](src/containers/Document.js) and [Editor.js](src/components/Editor.js) components.

```javascript
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
  // Remember to remove listeners on unmount!
  const { swarm } = this.props;
  if (swarm !== null) swarm.removeAllListeners('operation');
}
```

At component's mount we setup `saga` to be listening to new operations. In our case, operations are `Automerge` changes. As soon as an operation arrives, we apply it. (There is a special case which is the  document creation, that's why we use `Automerge.init()`, instead of the previous state: `this.doc`)


Next, we have the `updatePeerValue` function. For the sake of simplicity we are not using anything extra to maintain state. So, we will be passing down this function to our child component: the Editor. The Editor maintains a simple textarea component, as you can imagine when the textarea changes, that will trigger our `updatePeerValue` function.

We will use two important libraries:
  - [Automerge](https://github.com/automerge/automerge) will handle document transformations. It will give us changes that we can apply later. Automerge helps us maintain a [CRDT](https://en.wikipedia.org/wiki/Conflict-free_replicated_data_type) data structure, this is super useful when doing collaborative work :cool:.
  - [diff-match-patch](https://github.com/google/diff-match-patch) is an excellent library from Google that we are going to use to differentiate the type of changes between previous and current text state. This in conjunction with Automerge creates a pretty solid strategy for handling and distributing changes without conflicts over a network, a decentralized one in our case.

Now let's go through the `updatePeerValue` function because it does several things actually.

```javascript
updatePeerValue = val => {
  const { comm, username } = this.props;
  const { text } = val; // this is what the user wrote

  // This is a simple way to detect the document autor
  if (!this.original && comm.db.local.secretKey) {
    // It is super important to share the doc:creation change first and
    // then all the progressive changes.
    this.doc = Automerge.change(Automerge.init(), 'doc:creation', doc => {
      doc.text = new Automerge.Text();
    });
    const creationChange = Automerge.getChanges(Automerge.init(), this.doc);
    this.original = true;

    // here we are sharing a new operation related to the document creation
    // the last param: diff is used to share the history message
    comm.writeOperation({
      peerValue: creationChange,
      username,
      original: this.original,
      diff: [`${username} created the doc - ${stamp(new Date(Date.now()))}`]
    });
  }

  // this.dmp is a instance of diff-match-patch
  // the usage of diff-match-patch here is based on https://lorefnon.tech/2018/09/23/using-google-diff-match-patch-with-automerge-text/
  // Remember, our underlying editor is a simple textarea, so we need to detect specific modifications that happens to the text

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
              doc.text.deleteAt(idx);
            }
            return doc;
          });
          break;
        default:
          break;
      }
      if (newDoc) {
        // thanks to diff-match-patch we can apply the specific change (insert, delete) to Automerge Text.
        // Now we get the changes so we can share it with our peers.
        const changes = Automerge.getChanges(this.doc, newDoc);
        this.doc = newDoc;
        this.setState(
          {
            text,
            localHistory: [...this.state.localHistory, changes[0].message]
          },
          () => {
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
```

Last but not least, the editor, this is the simplest piece of the whole project.

Here are the important bits.

```javascript
  onChange = e => {
    const { value, selectionStart } = e.target;
    this.setState(
      {
        value,
        selectionStart
      },
      () => {
        if (this.state.selectionStart !== -1) {
          this.setCaretToPos(this.taRef, this.state.selectionStart);
        }
      }
    );
    this.props.updatePeerValue({ text: value });
    // Note(dk): a deboung will be better to not overload network
    // but is making things difficult with the UX.
    // Im going to revisit this strategy later, it requires a big refactor.
    // this.debouncedPeerValue({ text: value });
  };
```

The editor renders a textarea component with an `onChange` function attached to it. The `onChange` function updates the local value and call the `updatePeerValue` function that we have just seen.

#### Caveats

The app is not totally decentralized. It is good to know this from the very beginning. We need to use some signaling servers to bootstrap the discovery of peers. From that point onwards, the communication is among peers. Another _centralized_ moment is the first download of the app. This can be a github page, a CDN or whatever you want to use. Again, if the app works as a PWA with offline support, additional downloads will not be necessary.


#### Conclusions

We have just dealt with the development of a **Dat powered web app**. Let's summarize the important parts:

1. Install and instantiate `saga`. This is a top level interface on top of `hyperdb`.
2. Create the swarm. This is useful to find another peers. Since we are creating a webapp we will be relying on WebRTC for peer to peer communication. A signal server will be required then. You can host your own if you want to. This is [the one](https://github.com/soyuka/signalhubws) we recommend these days.
3. After `saga` instantiation and swarm creation, we can start playing with our app. :tada:
    1. Since we were after a collaborative editor, two modules appear as a good choice here: `Automerge` and `diff-match-patch`.
    2. We will share operations that we get from [Automerge](https://github.com/automerge/automerge#sending-and-receiving-changes) changes.
    3. `diff-match-patch` is used to extract `deltas` from plain text.
4. That's all! :+1:

As you can see, thinking about sharing operations among peers opens the possibilities for new kind of applications and also makes things a bit easier. Looks like a win-win situation.

I hope this article helps you to start thinking on new possibilities and give it a try to use Dat on the web!

**Thanks!** :bird:

> If you want to contribute please create an issue with your suggestion and we can continue the discussion from there. :+1:

> Also, :star: is :heart: Well, not really ...but is cool. And you are cool. :sunglasses:
___
Brought to you by **GEUT LABS ʘ**
