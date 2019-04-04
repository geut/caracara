import React from 'react';
import SyntaxHighlighter from 'react-syntax-highlighter';

export default class CodeBlock extends React.PureComponent {
  static defaultProps = {
    language: null
  };

  render() {
    const { language, value } = this.props;

    console.log('language is', language);
    return <SyntaxHighlighter language={language}>{value}</SyntaxHighlighter>;
  }
}
