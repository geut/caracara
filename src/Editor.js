import Plain from 'slate-plain-serializer'
// import { Editor } from 'slate-react'

import Prism from 'prismjs'
import React, { Component } from 'react'

/**
 * Add the markdown syntax to Prism.
 */

// eslint-disable-next-line
;Prism.languages.markdown=Prism.languages.extend("markup",{}),Prism.languages.insertBefore("markdown","prolog",{blockquote:{pattern:/^>(?:[\t ]*>)*/m,alias:"punctuation"},code:[{pattern:/^(?: {4}|\t).+/m,alias:"keyword"},{pattern:/``.+?``|`[^`\n]+`/,alias:"keyword"}],title:[{pattern:/\w+.*(?:\r?\n|\r)(?:==+|--+)/,alias:"important",inside:{punctuation:/==+$|--+$/}},{pattern:/(^\s*)#+.+/m,lookbehind:!0,alias:"important",inside:{punctuation:/^#+|#+$/}}],hr:{pattern:/(^\s*)([*-])([\t ]*\2){2,}(?=\s*$)/m,lookbehind:!0,alias:"punctuation"},list:{pattern:/(^\s*)(?:[*+-]|\d+\.)(?=[\t ].)/m,lookbehind:!0,alias:"punctuation"},"url-reference":{pattern:/!?\[[^\]]+\]:[\t ]+(?:\S+|<(?:\\.|[^>\\])+>)(?:[\t ]+(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\((?:\\.|[^)\\])*\)))?/,inside:{variable:{pattern:/^(!?\[)[^\]]+/,lookbehind:!0},string:/(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\((?:\\.|[^)\\])*\))$/,punctuation:/^[\[\]!:]|[<>]/},alias:"url"},bold:{pattern:/(^|[^\\])(\*\*|__)(?:(?:\r?\n|\r)(?!\r?\n|\r)|.)+?\2/,lookbehind:!0,inside:{punctuation:/^\*\*|^__|\*\*$|__$/}},italic:{pattern:/(^|[^\\])([*_])(?:(?:\r?\n|\r)(?!\r?\n|\r)|.)+?\2/,lookbehind:!0,inside:{punctuation:/^[*_]|[*_]$/}},url:{pattern:/!?\[[^\]]+\](?:\([^\s)]+(?:[\t ]+"(?:\\.|[^"\\])*")?\)| ?\[[^\]\n]*\])/,inside:{variable:{pattern:/(!?\[)[^\]]+(?=\]$)/,lookbehind:!0},string:{pattern:/"(?:\\.|[^"\\])*"(?=\)$)/}}}}),Prism.languages.markdown.bold.inside.url=Prism.util.clone(Prism.languages.markdown.url),Prism.languages.markdown.italic.inside.url=Prism.util.clone(Prism.languages.markdown.url),Prism.languages.markdown.bold.inside.italic=Prism.util.clone(Prism.languages.markdown.italic),Prism.languages.markdown.italic.inside.bold=Prism.util.clone(Prism.languages.markdown.bold); // prettier-ignore

/**
 * Deserialize the initial editor value.
 *
 * @type {Object}
 */

const initialValue = Plain.deserialize(
  'Slate is flexible enough to add **decorations** that can format text based on its content. For example, this editor has **Markdown** preview decorations on it, to make it _dead_ simple to make an editor with built-in Markdown previewing.\n## Try it out!\nTry it out for yourself!'
)

/**
 * The markdown preview example.
 *
 * @type {Component}
 */

class MarkdownPreview extends Component {
  constructor(props) {
    super(props);
    this.state = {
      value: props.peerValue.text || '',
      lastKeyPress: null
    }
  }

  componentDidUpdate(prevProps, prevState) {
    /* OLD CHECK FOR SLATE STUFF :P
    if (this.props.peerValue &&
      this.props.peerValue.length &&
      this.props.peerValue.length !== prevProps.peerValue.length) {
      console.log('editor didupdate')
      console.log(this.props.peerValue)
      // this.editor.applyOperations(this.props.peerValue)
    }
    */
    const { value, lastKeyPress } = this.state;
    if (prevState.value === value) return;

    // determine operation
    // TODO(dk): in the future, consider EDIT op, maybe?
    let operation = 'ADD'
    if (lastKeyPress === 'BACKSPACE'){
      operation = 'DELETE'
    }
    const changes = {
      text: value,
      operation
    };
    this.props.updatePeerValue(changes);
  }


  /**
   *
   * Render the example.
   *
   * @return {Component} component
   */
  render() {
    /*
    return (
      <Editor
        placeholder="Write some markdown..."
        defaultValue={initialValue}
        renderMark={this.renderMark}
        decorateNode={this.decorateNode}
        onChange={this.onChange}
        ref={this.ref}
      />
    )
    */
    return <textarea
      placeholder="What's on your head?"
      value={this.props.peerValue.text}
      onChange={this.simpleOnChange}
      onKeyUp={this.onKey}
      rows={15}
      autoComplete={'off'}
      autoFocus={true}
    />;
  }

  /**
   * Store a reference to the `editor`.
   *
   * @param {Editor} editor
   */

  ref = editor => {
    this.editor = editor
  }

  simpleOnChange = e => {
    const { value } = e.target;
    this.setState({
      value
    })
  }

  onKey = e => {
    this.setState({
      lastKeyPress: e.key.toUpperCase()
    });
  }

  onChange = change => {
    const ops = change.operations
      .filter(
        o =>
          o.type !== 'set_selection' &&
          o.type !== 'set_value' &&
          (!o.data || !o.data.has('source'))
      )
      .toJS()
      .map(o => ({ ...o, data: { source: this.props.username } }))

    this.props.updatePeerValue(ops);
  }

  /**
   * When new `operations` are received from one of the other editors that is in
   * sync with this one, apply them in a new change.
   *
   * @param {Array} operations
   */

  applyOperations = operations => {
    this.remote = true
    operations.forEach(o => this.editor.applyOperation(o))
    this.remote = false
  }

  /**
   * Render a Slate mark.
   *
   * @param {Object} props
   * @param {Editor} editor
   * @param {Function} next
   * @return {Element}
   */

  renderMark = (props, editor, next) => {
    const { children, mark, attributes } = props

    switch (mark.type) {
      case 'bold':
        return <strong {...attributes}>{children}</strong>

      case 'code':
        return <code {...attributes}>{children}</code>

      case 'italic':
        return <em {...attributes}>{children}</em>

      case 'underlined':
        return <u {...attributes}>{children}</u>

      case 'title': {
        return (
          <span
            {...attributes}
            style={{
              fontWeight: 'bold',
              fontSize: '20px',
              margin: '20px 0 10px 0',
              display: 'inline-block',
            }}
          >
            {children}
          </span>
        )
      }

      case 'punctuation': {
        return (
          <span {...attributes} style={{ opacity: 0.2 }}>
            {children}
          </span>
        )
      }

      case 'list': {
        return (
          <span
            {...attributes}
            style={{
              paddingLeft: '10px',
              lineHeight: '10px',
              fontSize: '20px',
            }}
          >
            {children}
          </span>
        )
      }

      case 'hr': {
        return (
          <span
            {...attributes}
            style={{
              borderBottom: '2px solid #000',
              display: 'block',
              opacity: 0.2,
            }}
          >
            {children}
          </span>
        )
      }

      default: {
        return next()
      }
    }
  }

  /**
   * Define a decorator for markdown styles.
   *
   * @param {Node} node
   * @param {Function} next
   * @return {Array}
   */

  decorateNode(node, editor, next) {
    const others = next() || []
    if (node.object !== 'block') return others

    const string = node.text
    const texts = node.getTexts().toArray()
    const grammar = Prism.languages.markdown
    const tokens = Prism.tokenize(string, grammar)
    const decorations = []
    let startText = texts.shift()
    let endText = startText
    let startOffset = 0
    let endOffset = 0
    let start = 0

    function getLength(token) {
      if (typeof token == 'string') {
        return token.length
      } else if (typeof token.content == 'string') {
        return token.content.length
      } else {
        return token.content.reduce((l, t) => l + getLength(t), 0)
      }
    }

    for (const token of tokens) {
      startText = endText
      startOffset = endOffset

      const length = getLength(token)
      const end = start + length

      let available = startText.text.length - startOffset
      let remaining = length

      endOffset = startOffset + remaining

      while (available < remaining) {
        endText = texts.shift()
        remaining = length - available
        available = endText.text.length
        endOffset = remaining
      }

      if (typeof token != 'string') {
        const dec = {
          anchor: {
            key: startText.key,
            offset: startOffset,
          },
          focus: {
            key: endText.key,
            offset: endOffset,
          },
          mark: {
            type: token.type,
          },
        }

        decorations.push(dec)
      }

      start = end
    }

    return [...others, ...decorations]
  }
}

/**
 * Export.
 */

export default MarkdownPreview
