import { debounce } from 'debounce';
import React, { Component } from 'react';
import TextField from '@material-ui/core/TextField';

class Editor extends Component {
  constructor(props) {
    super(props);
    this.state = {
      value: props.text || '',
      selectionStart: -1
    };
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.text === this.state.text) return;
    if (this.state.selectionStart !== -1) {
      this.setCaretToPos(this.taRef, this.state.selectionStart);
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
    const { classes } = this.props;

    return (
      <TextField
        inputRef={input => (this.taRef = input)}
        id="outlined-multiline-static"
        label="Editor"
        multiline
        rows="15"
        placeholder="What's on your head?"
        className={classes}
        margin="normal"
        variant="outlined"
        onChange={this.onChange}
        value={this.state.value}
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

  onChange = e => {
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
