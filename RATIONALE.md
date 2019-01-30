# CARACARA editor

## The name

The [caracara](https://en.wikipedia.org/wiki/Southern_crested_caracara) is one of the birds that annually visit Tierra del Fuego. I like the name and the emoji 🐧.

## Goal

To create a P2P collaborative editor.

## The idea

Try to combine, [again](https://github.com/geut/olaf), Dat + web app world. This is a new experimental app, a mix between kingdoms. When you combine something like this (at first two different worlds into one) the result does not meant to be a sum of all the benefits or even cons. No, it is more like a new thing. In that case, what can you expect from a web app combined with Dat? We at GEUT believe that it is worth the effort of exploring these combinations. In particular, when we say `web app` we are talking about PWAs where offline
support is something that comes first and it is a key feature, common in the decentralized world. The addition of Dat plays a part on the efficient _spreading_ of the content between peers.

## The execution

Remember, at the beginning we mention this is not the first web app + Dat thing we've built. Our first effort was Olaf, a chat with a distributed twist. We learn a lot building Olaf so the idea when we started working on caracara was to reuse some bits, in particular the `P2P core` of Olaf, **Saga**.
**Saga** handles connection and messaging, one can say is a wrapper around [hyperdb](https://github.com/mafintosh/hyperdb) and it won't be wrong. But we are changing some things.

### The core

Originally, Saga was built for a chat app. Now we are playing with an editor. Apps are similar but not the same. We decided to shift some parts of Saga, where we share messages we are now thinking of `operations`. The message that was used for sending only text can be seen now as a container for your app core logic. So, in this case we are sending not only the editor value but also information about the recent operation, keystroke, etc. 

Saga rebuilds the app history on each client. For successfully merging text we decide to use [automerge](https://github.com/automerge/automerge). The rest is just hyperdb. We iterate over operations (from the feeds), identify latest operations and merge the text after that. 

### The flow

First you open the app, if you are the original autor or the 1st writer then you will have a draftId key to share with others. If you are a collaborator, you will receive a link to the app with the draftId on it.

Next, the app asks for your username. This is a _primitive_ way of identify an user. Later when the user starts working with the app, all the actions made from that user will be shared. This user is now a writer (in hyperdb terms). Identity is a though and super interesting problem on the decentralized world. Totally out of the scope for a simple doc like this one. Anyway, we think this part is worth the mention too. And you can see a similar flow in Olaf chat. 

After identify yourself, you can start using the app. There is a history with a list of changes and the editor itself.

### The caveats

The app is not totally decentralized. It is good to know this from the beginning. We need to use signaling servers to bootstrap the discovery of peers. From that point and later the communication is between peers. Another _centralized_ moment is the first download of the app. This can be from a github page or whatever you want to use. Again, if the app works as a PWA with offline support, additional downloads won't be necessary.

## What is next?

Well, lot of things to do. 
- Clean the code first.
- Improve the operation object, we may need to send more data.
- Improve history. If the operation object is more robust we can extract more granular data about changes.
- Up to this point we can start adding new features like, download the doc, undo, preview the md, and many others.

If you wan to contribute please create an issue with your suggestion and we can continue the discussion from there. :+1: 

**Thanks!** 🐧
___
** GEUT LABS ʘ **
