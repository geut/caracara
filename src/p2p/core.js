const Automerge = require('automerge')
const EventEmitter = require('events')
const { Writable } = require('stream')
const hyperdb = require('hyperdb')
const pump = require('pump')
const hyperid = require('hyperid')
const tinydate = require('tinydate').default
const uuid = hyperid()

const stamp = tinydate('{HH}:{mm}:{ss}');

class ForEachChunk extends Writable {
  constructor (opts, cb) {
    if (!cb) {
      cb = opts
      opts = {}
    }
    super(opts)

    this.cb = cb
  }

  _write (chunk, enc, next) {
    this.cb(chunk, enc, next)
  }
}

const forEachChunk = (...args) => new ForEachChunk(...args)

class Saga extends EventEmitter {
  constructor (storage, key, username) {
    super()

    this.operations = new Map()
    this.newestOperations = []
    this.users = new Map()
    this.username = username
    this.timestamp = Date.now()
    this.doc = Automerge.init()

    this.db = hyperdb(storage, key, { valueEncoding: 'json' })
  }

  async initialize () {
    await this._ready()

    this._updateHistory(this._watchForOperations.bind(this))
  }

  // TODO(dk); rename to writeOperation
  writeMessage (message) {
    const key = `operations/${uuid()}`
    // NOTE(dk): operation can be part of message. Maybe message can be seen as content receipt? but thus would make an op like a 2nd class citizen and we dont want to transmit that :thinking:
    const data = {
      key,
      message,
      username: this.username,
      timestamp: Date.now()
    }

    return new Promise((resolve, reject) => {
      this.db.put(key, data, (err) => {
        if (err) {
          reject(err)
        } else {
          resolve(key)
        }
      })
    })
  }

  replicate () {
    return this.db.replicate({
      live: true,
      userData: JSON.stringify({
        key: this.db.local.key,
        username: this.username,
        timestamp: this.timestamp
      })
    })
  }

  async connect (peer) {
    if (!peer.remoteUserData) {
      throw new Error('peer does not have userData')
    }

    const data = JSON.parse(peer.remoteUserData)

    const key = Buffer.from(data.key)
    const username = data.username

    await this._authorize(key)

    if (!this.users.has(username)) {
      this.users.set(username, new Date())
      this.emit('join', data)
      peer.on('close', () => {
        if (!this.users.has(username)) return
        this.users.delete(username)
        this.emit('leave', data)
      })
    }
  }

  _authorize (key) {
    return new Promise((resolve, reject) => {
      this.db.authorized(key, (err, auth) => {
        if (err) return reject(err)

        if (auth) {
          return resolve()
        }

        this.db.authorize(key, (err) => {
          if (err) return reject(err)
          resolve()
        })
      })
    })
  }

  _updateHistory (onFinish) {
    const h = this.db.createHistoryStream({ reverse: true })

    // reset newestOperations
    this.newestOperations = []

    const ws = forEachChunk({ objectMode: true }, (data, enc, next) => {
      const { key } = data

      if (/operations/.test(key)) {
        console.log(`check if operations has key ${key}`)
        if (this.operations.has(key)) {
          // TODO(dk): check this condition, if we destroy the stream nothing works. In the other hand
          // it would be cool to not process everything again and again. That was the purpose of maintaining
          // a newestOperations array.

          // h.destroy()
          // return
        } else {
          console.log(`Adding new operation key ${key}`)
          this.newestOperations.push(data)
        }
      }

      next()
    })

    pump(h, ws, err => {
      // work with latest operations in the right order
      this.newestOperations.reverse().forEach((op, idx) => {
        console.log('aplicando operaciones nuevas')
        const { key, value } = op;
        const { message } = value;
        const { peerValue } = message;
        const { operation } = peerValue;
        const historyMessage = `${value.username} ${operation === 'DELETE' ? 'removed' : 'added'} some text - ⌚️ ${stamp(new Date(value.timestamp))}`;
        const newDoc = Automerge.change(this.doc,
          historyMessage,
          doc => {
            doc.text = new Automerge.Text()
            doc.text.insertAt(0, value.message.peerValue.text)
            return doc
          }
        )
        const history = Automerge.getHistory(newDoc).map(state => [state.change.message, state.snapshot.text])
        this.emit('message', { ...value, text: newDoc.text.join(''), history }, key)
        // write latest operation
        /*
        if (idx === 0) {
          console.log(`last known operation key ${op.key}`)
          console.log(`last known operation text ${op.value.message.peerValue.text}`)
          this.operations.set(op.key, op.value);
        }
        */
        this.operations.set(op.key, op.value);
      })

      if (onFinish) onFinish(err)
    })
  }

  _watchForOperations() {
    this.db.watch('operations', () => {
      this._updateHistory()
    })

  }

  _ready () {
    return new Promise(resolve => this.db.ready(resolve))
  }
}

export default (...args) => new Saga(...args)
