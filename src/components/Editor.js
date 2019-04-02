import { debounce } from 'debounce';
import React, { Component } from 'react';

import FormControl from '@material-ui/core/FormControl';
import InputBase from '@material-ui/core/InputBase';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  textField: {
    padding: theme.spacing.unit * 2,
    display: 'flex',
    flex: 1,
    flexDirection: 'column'
  },
  inputBase: {
    overflow: 'auto',
    flex: 1,
    '& > div:first-child': {
      height: '100%'
    }
  },
  input: {
    //TODO(elmasse,dk) hmmm, arrgghh, eeehmmm... shhhh
    height: '100% !important'
  }
});

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
    const disabled = !text && !isAuthor;
    return (
      <FormControl className={classes.textField}>
        <InputBase
          inputRef={input => (this.taRef = input)}
          id="editor"
          inputProps={{ className: classes.input }}
          classes={{ root: classes.inputBase }}
          multiline
          placeholder={disabled ? 'Loading peer data...' : ''}
          disabled={disabled}
          onChange={this.onChange}
          value={text}
          autoComplete={'off'}
          autoFocus={true}
        />
      </FormControl>
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
  }, 200);

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
}

/**
 * Export.
 */

export default withStyles(styles)(Editor);
