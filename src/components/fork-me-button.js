import React from 'react';

import './fork-me-button.css';

export default class GithubForkButton extends React.Component {
  constructor(props) {
    super(props);
    this.state = { visible: true, opacity: 1 };
  }

  componentDidMount() {
    this.setTimer();
  }

  componentWillUnmount() {
    clearTimeout(this._timer);
  }

  setTimer() {
    // clear any existing timer
    this._timer = this._timer != null ? clearTimeout(this._timer) : null;

    // hide after `delay` milliseconds
    this._timer = setTimeout(() => {
      this.setState({opacity: 0});
      this._timer = null;
      setTimeout(() => { this.setState({visible: false}); }, 1000);
    }, this.props.delay);
  }

  render() {
    if (this.state.visible) {
      return <span id="forkongithub" style={{opacity: this.state.opacity}}>
      <a href="https://github.com/ateliedocodigo/api-updates/fork" rel="noopener noreferrer" target="_blank">Fork me on GitHub</a>
    </span>
    }
    return <span></span>
  }
}

GithubForkButton.defaultProps = {
  delay: 1500,
}
