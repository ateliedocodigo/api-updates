import React, { Component } from 'react';

class Link extends Component {

  constructor(props) {
    super(props);
    // console.log('link props', props)
    this.state = { error: false, loading: false, text: '' };
    this.onClick = this.onClick.bind(this);
  }

  async onClick(e) {
    e && e.preventDefault();

    this.setState({loading: true});

    const result = await fetch(this.props.href)
    .then((r) => {
        if (!r.ok) {
            throw Error(`${r.status} - ${r.statusText}`);
        }
        return r.json();
    })
    .then((body) => {
      const result = {
        text: this.parse(body),
        error: false
      };
      return result;
    })
    .catch((e) => {
      let err_str = e.toString()
      if (e instanceof TypeError) {
          err_str = "Cors Disabled";
      }
      console.error("Nonon", e);
      const result = {
        text: err_str,
        error: true
      };
      return result;
    })
    .finally(() => {
      this.setState({loading: false})
    });
    this.props.updateRow(this.props.row, this.props.column, result);
  }

  parse(body) {
    return body.branch || body.version || body.status;
  }

  render() {
    const { href, children } = this.props;
    const loading = this.state.loading && 'Loading...';
    const text = loading || this.state.text || children;
    if (!href || !children) {
      return null;
    }

    return (
      <a href={ href } onClick={this.onClick} rel="noopener noreferrer" target="_blank">
        { text }
      </a>
    );
  }
}

export default Link;