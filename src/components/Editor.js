import { debounce } from 'debounce';
import React, { Component } from 'react';

import FormControl from '@material-ui/core/FormControl';
import FormLabel from '@material-ui/core/FormLabel';
import InputBase from '@material-ui/core/InputBase';
// import InputLabel from '@material-ui/core/InputLabel';
// import TextField from '@material-ui/core/TextField';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  textField: {
    margin: theme.spacing.unit * 2,
    display: 'flex',
    flexDirection: 'column',
    flex: 1
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

    return (
      <FormControl fullWidth className={classes.textField}>
        <FormLabel>Editor</FormLabel>
        <InputBase
          inputRef={input => (this.taRef = input)}
          id="editor"
          inputProps={{ className: classes.input }}
          classes={{ root: classes.inputBase }}
          multiline
          // placeholder="What's on your head?"
          disabled={!text && !isAuthor}
          onChange={this.onChange}
          value={text}
          autoComplete={'off'}
          autoFocus={true}
        />
      </FormControl>

      // <TextField
      //   fullWidth
      //   inputRef={input => (this.taRef = input)}
      //   id="outlined-multiline-static"
      //   label="Editor"
      //   InputProps={{
      //     classes: {
      //       root: classes.inputBase
      //     }
      //   }}
      //   multiline
      //   placeholder="What's on your head?"
      //   className={classes.textField}
      //   margin="normal"
      //   disabled={!text && !isAuthor}
      //   onChange={this.onChange}
      //   value={text}
      //   autoComplete={'off'}
      //   autoFocus={true}
      // />
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
