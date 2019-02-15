# CARACARA 🐧

> An experimental web app + `Dat` collaborative editor

## Preamble: The name

The [caracara](https://en.wikipedia.org/wiki/Southern_crested_caracara) is one of the birds that annually visit Tierra del Fuego.

## Contents
* [Usage](#usage)
* [Article](#article)

## Usage

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

## Article

### Caracara: React + Dat + Automerge
> Or how to create a simple collaborative editor on the distributed web

#### Introduction: The idea

Trying to combine, [again](https://github.com/geut/olaf), Dat with some web development. The result will be a new _experimental_ app, a mix between kingdoms.
When you combine something like this (at first two different worlds into one) the result does not meant to be a sum of all the benefits or even cons. No, it is more like a new thing.
In this case, what can you expect from a web app combined with Dat? You can [see it](https://caracara.hashbase.io/) for yourself. The content is distributed and owned by the peers.

In particular, when we say `web app` we are talking about PWAs where offline
support is something that comes first and it is a key feature, common in the decentralized world. The addition of Dat plays a part on the efficient _spreading_ of the content between peers.

All in all, we at [GEUT](https://github.com/geut) believe that it is worth the effort of exploring these combinations.

#### Start

Remember, our goal is to create a simple collaborative text editor. This means, peer A writes some text, shares the copy with other peer, call it B, automatically authorizing B to be a new writer.

OK, let's start with the bootstrap of our web app. We are going to be using [React](https://reactjs.org/) for this matter. More specifically, `create-react-app` to make things quicker.

`npx create-react-app caracara`

 After that,

 `cd caracara && npm start`

 Cool, the app is running locally. We are going to add a new module now, called `@geut/saga`. This will give P2P powers to our app. :sparkles:

 #### Saga

 `Saga` is a helper module developed by GEUT, that you can use to easily share operations between peers. You can think about this, like _applications chatting each other_. On top of this, we can do whatever we want with the operations, in this case will be to _regenerate_ the document history on every peer when a new operation arrives. Since `saga` will help us to establish a connection and exchange messages with other peers we need to see how can it play with our app.

First, install the dependencies:

`npm install @geut/saga @geut/discovery-swarm-webrtc`

Now we need to create a connection, this would allow us to talk with a _swarm_ of peers:

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

That are the important bits of the swarm creation. Now, let's see how we use this inside our app.

```javascript
  async componentDidUpdate(prevProps, prevState) {
    const { modalIsOpen, username } = this.state;

    if (prevState.modalIsOpen && !modalIsOpen && username) {
      // swarm creation, the username is required, if the draftId is null, then saga will create one for us.
      // We can share this key with others peers which will became collaborators.
      this.comm = await swarm(username, this.draftId);
    }
  }
```

#### The editor

Great! We've just seen the swarm creation phase and we also have connect it with our app. Now it's time to start playing a bit with the editor.

There are two new important dependencies at this step:

`npm install automerge diff-match-patch`

For this part we are going to highlight the [Doc.js](src/Doc.js) and [Editor.js](src/Editor.js) components.

```javascript
async componentDidMount() {
  // Doc component will receive a saga instance (called comm) via props.
  // We use the operation event here:
  this.props.comm.on('operation', data => {
    const { username, message } = data;
    if (username === this.props.username) return;
    if (message.peerValue.length === 0) return;
    // message.peerValue contains doc changes. We will see more about this soon.
    let newDoc;
    if (!this.doc) {
      newDoc = Automerge.applyChanges(Automerge.init(), message.peerValue);
    } else {
      newDoc = Automerge.applyChanges(this.doc, message.peerValue);
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
  // Remember to remove listeners on unmount!
  this.props.comm.removeAllListeners('operation');
}
```

At component's mount we setup `saga` to be listening for new operations. In our case, operations are `Automerge` changes. When one arrives, we apply them. There is a special case which is document creation that does not have past history, thus why we use `Automerge.init()`, otherwise we use or previous state: `this.doc`.

The next important part is the `updatePeerValue` function. For the sake of simplicity we are not using anything extra to maintain state, so we will be passing down this function to our child component, the Editor. The Editor maintains a simple textarea component, as you can imagine when the textarea changes, that will trigger our `updatePeerValue` function.

We will use two important libraries:
  - [Automerge](https://github.com/automerge/automerge), will handle document transformations. It will give us changes that we can apply later. Automerge help us maintain a [CRDT](https://en.wikipedia.org/wiki/Conflict-free_replicated_data_type) data structure, this is super useful when doing collaborative work :cool:.
  - [diff-match-patch](https://github.com/google/diff-match-patch): is an excellent library from Google that we are going to use to differentiate the type of changes between previous and current text state. This in conjunction with Automerge creates a pretty solid strategy for handling and distributing changes without conflicts over a network, a decentralized one in our case.

Now let's go through the `updatePeerValue` function because it does _some_ things.

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

Last but not least, the editor, this is the most simplest piece of the whole project.

The important bits below:

```javascript
debouncedPeerValue = debounce(({ text }) => {
  this.props.updatePeerValue({ text });
}, 20);

onChange = e => {
  const { value, selectionStart } = e.target;

  this.setState({
    value,
    selectionStart
  });
  this.debouncedPeerValue({ text: value });
};
```

The editor renders a textarea component with an `onChange` function attached to it. The `onChange` function updates the local value and call the `updatePeerValue` function that we just saw. We also added a debounce function to improve the UX a little bit.

#### Caveats

The app is not _totally_ decentralized. It is good to know this from the beginning. We need to use some signaling servers to bootstrap the discovery of peers. From that point and later the communication is between peers. Another _centralized_ moment is the first download of the app. This can be a github page, a CDN or whatever thing that you want to use. Again, if the app works as a PWA with offline support, additional downloads won't be necessary.


#### Conclusions

We just tour the development of a **Dat powered web app**. Let's summarize the important parts:

1. Install and instantiate `saga`. This will be a top level interface on top of `hyperdb`.
1. Create the swarm. This is useful to find another peers. Since we are creating a webapp we will be relying on WebRTC for peer to peer communication. A signal server will be required then. You can host your own if you want to. This is [the one](https://github.com/soyuka/signalhubws) we recommend these days.
1. After `saga` instantiation and swarm creation, we can start playing with our app. :tada:
  1. Since we were after a collaborative editor, two modules appear as a good choice here: `Automerge` and `diff-match-patch`.
  1. We will share operations that we get from [Automerge](https://github.com/automerge/automerge#sending-and-receiving-changes) changes.
  1. `diff-match-patch` is used to extract `deltas` from plain text.
1. That's all! :+1:

As you can see, thinking about sharing operations between peers opens the possibilities for new kind of applications and also makes things a bit easier. Looks like a win-win situation.

I hope this article helps you to start thinking on new possibilities and start using Dat on the web!

**Thanks!** :bird:

> If you want to contribute please create an issue with your suggestion and we can continue the discussion from there. :+1:
___
Brought to you by **GEUT LABS ʘ**
