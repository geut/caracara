import React from 'react';
import SyntaxHighlighter from 'react-syntax-highlighter';

export default class CodeBlock extends React.PureComponent {
  static defaultProps = {
    language: 'text'
  };

  render() {
    const { language, value } = this.props;

    return (
      <SyntaxHighlighter language={language != null ? language : 'text'}>
        {value != null ? value : ''}
      </SyntaxHighlighter>
    );
  }
}
