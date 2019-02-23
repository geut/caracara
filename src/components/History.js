import React from 'react';

import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Typography from '@material-ui/core/Typography';

const History = props => (
  <>
    <Typography
      color="textSecondary"
      variant="subtitle1"
      className={props.classes.title}
    >
      History
    </Typography>
    <List dense className={props.classes.items}>
      {props.history.length
        ? [...props.history].reverse().map((h, i) => {
            const [user, ...rest] = h.replace(' - ', ' ').split(' ');
            const msg = rest.join(' ');
            return (
              <ListItem key={`history-${i}`}>
                <ListItemText primary={user} secondary={msg} />
              </ListItem>
            );
          })
        : ''}
    </List>
  </>
);

export default History;
