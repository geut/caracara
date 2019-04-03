import React, { Component } from 'react';

import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import markdown from 'react-syntax-highlighter/dist/esm/languages/hljs/markdown';
import hljsStyle from 'react-syntax-highlighter/dist/esm/styles/hljs/dracula';

import Drawer from '@material-ui/core/Drawer';
import Fab from '@material-ui/core/Fab';
import SubjectIcon from '@material-ui/icons/Subject';
import { withStyles } from '@material-ui/core/styles';

SyntaxHighlighter.registerLanguage('markdown', markdown);

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
    background: 'rgb(40, 42, 54)',
    width: '60%',
    height: '100%',
    [theme.breakpoints.down('sm')]: {
      width: '90%'
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
            <SyntaxHighlighter
              customStyle={{
                display: 'flex',
                flex: 1,
                padding: '16px',
                flexDirection: 'column',
                height: '100%',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}
              style={hljsStyle}
              language="markdown"
            >
              {text}
            </SyntaxHighlighter>
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
