import { debounce } from 'debounce';
import React, { Component } from 'react';
import TextField from '@material-ui/core/TextField';

class Editor extends Component {
  constructor(props) {
    super(props);
    this.state = {
      value: props.text || '',
      selectionStart: -1,
      isLocalUpdate: false
    };
  }

  render() {
    const { classes, text, isAuthor } = this.props;

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
        disabled={!text && !isAuthor}
        onChange={this.onChange}
        value={text}
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
  }, 2000);

  onChange = e => {
    const { value, selectionStart } = e.target;
    console.log({ value });
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
}

/**
 * Export.
 */

export default Editor;
