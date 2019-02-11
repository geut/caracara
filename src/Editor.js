import { debounce } from 'debounce';
import React, { Component } from 'react';

class Editor extends Component {
  constructor(props) {
    super(props);
    this.state = {
      value: props.text || '',
      selectionStart: -1
    };
    this.taRef = React.createRef();
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.text === this.state.text) return;
    if (this.state.selectionStart !== -1) {
      this.setCaretToPos(this.taRef.current, this.state.selectionStart);
    }
  }

  static getDerivedStateFromProps(props, state) {
    if (props.text !== state.value) {
      return { value: props.text };
    }
    return null;
  }

  shouldComponenUpdate(nextProps, nextState) {
    if (nextProps.text === this.state.text) return false;
    return true;
  }

  render() {
    return (
      <textarea
        ref={this.taRef}
        placeholder="What's on your head?"
        value={this.state.value}
        onChange={this.simpleOnChange}
        rows={15}
        autoComplete={'off'}
        autoFocus={true}
      />
    );
  }

  setSelectionRange = (input, selectionStart, selectionEnd) => {
    if (input.setSelectionRange) {
      input.focus();
      input.setSelectionRange(selectionStart, selectionEnd);
    } else if (input.createTextRange) {
      const range = input.createTextRange();
      range.collapse(true);
      range.moveEnd('character', selectionEnd);
      range.moveStart('character', selectionStart);
      range.select();
    }
  };

  setCaretToPos = (input, pos) => {
    this.setSelectionRange(input, pos, pos);
  };

  debouncedPeerValue = debounce(({ text }) => {
    this.props.updatePeerValue({ text });
  }, 20);

  simpleOnChange = e => {
    const { value, selectionStart } = e.target;

    this.setState({
      value,
      selectionStart
    });
    this.debouncedPeerValue({ text: value });
  };
}

/**
 * Export.
 */

export default Editor;
