import React, { Component } from 'react';

import ReactMarkdown from 'react-markdown';

import Drawer from '@material-ui/core/Drawer';
import Fab from '@material-ui/core/Fab';
import SubjectIcon from '@material-ui/icons/Subject';
import { withStyles } from '@material-ui/core/styles';

import CodeBlock from './plugins/CodeBlock';

const styles = theme => ({
  preview: {
    height: '100%'
  },
  fab: {
    position: 'absolute',
    bottom: theme.spacing.unit * 2,
    right: theme.spacing.unit * 2,
    zIndex: 5
  },
  extendedIcon: {
    marginRight: theme.spacing.unit
  },
  drawerPaper: {
    width: '60%',
    height: '100%',
    [theme.breakpoints.down('sm')]: {
      width: '90%'
    }
  },
  mdelem: {
    fontFamily: theme.typography.fontFamily,
    padding: theme.spacing.unit * 4,
    '& > table': {
      borderCollapse: 'collapse',
      borderSpacing: '0'
    },
    '& > table tr:nth-child(2n)': {
      background: '#f6f8fa'
    },
    '& > table tr': {
      borderTop: '1px solid #c6cbd1',
      background: '#fff'
    },
    '& > table th,td': {
      padding: '6px 13px',
      border: '1px solid #dfe2e5'
    },
    '& > blockquote': {
      borderLeft: '.25em solid #dfe2e5',
      color: '#6a737d',
      padding: '0 1em',
      margin: 0
    }
  }
});

class EditorPreview extends Component {
  constructor(props) {
    super(props);
    this.state = {
      value: props.text || '',
      enabled: false
    };
  }

  togglePreview = () => {
    this.setState(prevState => ({
      enabled: !prevState.enabled
    }));
  };

  render() {
    const { classes, text } = this.props;
    return (
      <React.Fragment>
        <Fab
          variant="extended"
          aria-label="Preview"
          className={classes.fab}
          onClick={this.togglePreview}
        >
          <SubjectIcon className={classes.extendedIcon} />
          Preview
        </Fab>
        <div className={classes.preview}>
          <Drawer
            anchor="right"
            open={this.state.enabled}
            onClose={this.togglePreview}
            classes={{
              paper: classes.drawerPaper
            }}
          >
            <ReactMarkdown
              source={text}
              className={classes.mdelem}
              renderers={{ code: CodeBlock }}
              escapeHtml={false}
            />
          </Drawer>
        </div>
      </React.Fragment>
    );
  }
}

/**
 * Export.
 */

export default withStyles(styles)(EditorPreview);
