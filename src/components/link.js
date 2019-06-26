import React, { Component } from 'react';

class Link extends Component {

  constructor(props) {
    super(props);
    console.log('link props', props)
    this.state = { error: false, loading: false, text: '' };
    this.onClick = this.onClick.bind(this);
  }

  onClick(e) {
    e && e.preventDefault();

    // console.log(this.props)
    this.setState({loading: true});

    fetch(this.props.href)
    .then((r) => {
        if (!r.ok) {
            throw Error(`${r.status} - ${r.statusText}`);
        }
        return r.json();
    })
    .then((d) => {
        this.setState({
          text: this.parse(d),
          error: false
        });
        // console.log('success', this.state,  this.parse(d));
    })
    .catch((e) => {
        let err_str = e.toString()
        if (e instanceof TypeError) {
            err_str = "Cors Disabled";
        }
        console.error("Nonon", e);
        // this.innerText = err_str;
        this.setState({
          text: err_str,
          error: true
        });

        // setError(true);
    })
    .finally(() => {
      this.setState({loading: false})
      // console.log(this.state);
      this.props.checkStatus();
//         const row = getParentRow(this);
// //            const elementToCompare = document.querySelector("#"+this.getAttribute('data-compare-to')+'');
//         const hrefCompareTo = this.getAttribute('data-compare-to')
//         const elementToCompare = this.closest('tr').querySelector(`a[href="${hrefCompareTo}"]`);
//         differ = compareResults(this, elementToCompare);
//         setClass(row, differ);
//         setResult(row, differ);
    });
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
      <a href={ href } onClick={this.onClick} target="_blank">
        { text }
      </a>
    );
  }
}

export default Link;