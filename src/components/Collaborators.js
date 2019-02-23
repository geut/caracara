import React from 'react';

import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Typography from '@material-ui/core/Typography';

const Collaborators = props => (
  <>
    <Typography
      color="textSecondary"
      variant="subtitle1"
      className={props.classes.title}
    >
      Collaborators
    </Typography>
    <List dense className={props.classes.items}>
      {props.users.map((u, i) => {
        return (
          <ListItem key={`users-${i}`}>
            <ListItemText primary={u} />
          </ListItem>
        );
      })}
    </List>
  </>
);

export default Collaborators;
