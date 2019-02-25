import React from 'react';

import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';

const Collaborators = props => (
  <List dense className={props.classes.items}>
    {props.users.map((u, i) => {
      return (
        <ListItem key={`users-${i}`}>
          <ListItemText primary={u} />
        </ListItem>
      );
    })}
  </List>
);

export default Collaborators;
