import React from 'react';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';

function getModalStyle() {
  const top = 50;
  const left = 50;

  return {
    top: `${top}%`,
    left: `${left}%`,
    transform: `translate(-${top}%, -${left}%)`
  };
}

const Username = props => (
  <div
    style={getModalStyle()}
    className={props.classes}
    onKeyDown={e => e.key === 'Enter' && props.closeModal()}
  >
    <Typography variant="subtitle1" gutterBottom>
      Set your username
    </Typography>
    <TextField
      required
      error={props.error}
      label="Username"
      fullWidth={true}
      margin="normal"
      onChange={props.onUsernameChange}
      helperText={props.error ? 'Username is required' : ''}
    />
    <Button
      variant="contained"
      color="primary"
      type="submit"
      onClick={props.closeModal}
    >
      Enter
    </Button>
  </div>
);

export default Username;
