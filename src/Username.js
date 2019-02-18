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
  <div style={getModalStyle()} className={props.classes}>
    <form onSubmit={props.closeModal}>
      <Typography variant="subtitle1" gutterBottom>
        Set your username
      </Typography>
      <TextField
        required
        label="Username"
        fullWidth={true}
        margin="normal"
        onChange={props.saveUsername}
      />
      <Button variant="contained" color="primary" type="submit">
        Enter
      </Button>
    </form>
  </div>
);

export default Username;
