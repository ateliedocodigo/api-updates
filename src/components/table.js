import React from 'react';
import ReactTable from 'react-table';
import 'react-table/react-table.css';
import './table.css';

import { createBrowserHistory } from 'history';

class Table extends React.Component {
  constructor(props) {
    super(props);
    const urlParams = new URLSearchParams(window.location.search);
    const default_config_url = 'default.json';
    let config_url = default_config_url;
    if (urlParams.has('config')) {
        config_url = urlParams.get('config')
    }
    // console.log(urlParams.get('config'), config_url)
    this.state = { data: [], projects: [], config_url, loading: false, default_config_url };
  }

  history = createBrowserHistory();

  pushHistory = () =>{
    const urlParams = new URLSearchParams(window.location.search);
    if (this.state.config_url === urlParams.get('config')) {
      return;
    }
    urlParams.set('config', this.state.config_url);
    this.history.push(`?${urlParams.toString()}`);
    // console.log(urlParams.toString());
  }

  handleSubmit = (e) => {
    e && e.preventDefault();

    if (!this.state.config_url.length) {
      return;
    }

    this.pushHistory();

    this.setState({loading: true});

    fetch(this.state.config_url)
    .then((r) => {
        if (!r.ok) {
            throw Error(`${r.status} - ${r.statusText}`);
        }
        return r.json();
    })
    .then((d) => {
        // console.log(d['projects']);
        this.setState({
          projects: d['projects']
        });
        // console.log(this.state.projects);
    })
    .catch((e) => {
        let err_str = e.toString()
        if (e instanceof TypeError) {
          err_str = "Cors Disabled";
        }
        console.error("Nonon", err_str, e);
        this.setState({projects: []})
    })
    .finally(() => {
        this.setState({loading: false});
    });
  }

  triggerLink = async (row, column) => {
    let projects = [...this.state.projects];

    const result = await this.getLinkStatus(row, column);

    projects = this.updateResult(row, column, result, projects);
    projects[row].result = 0;
    projects[row][column].error = result.error;
    console.log('Error?', result.error);
    if (!this.hasError(projects[row].development, projects[row].staging, projects[row].production)) {
      const is_equal = this.compareResults(projects[row].development, projects[row].staging, projects[row].production);
      projects[row].result = is_equal ? 2 : 1;
    }
    // projects[row].result = result.error ? 0 : this.compareResults(projects[row].staging, projects[row].production);
    this.setState({ projects });
  }

  triggerRowLinks = async (row) => {
    let projects = [...this.state.projects];
    if (projects[row].disabled) {
      return;
    }

    const [dev_result, stg_result, prd_result] = await Promise.all([
      this.getLinkStatus(row, 'development'),
      this.getLinkStatus(row, 'staging'),
      this.getLinkStatus(row, 'production'),
    ]);

    // console.log(stg_result, prd_result)
    projects = this.updateResult(row, 'development', dev_result, projects);
    projects = this.updateResult(row, 'staging', stg_result, projects);
    projects = this.updateResult(row, 'production', prd_result, projects);

    projects[row].result = 0;
    if (!this.hasError(projects[row].development, projects[row].staging, projects[row].production)) {
      const is_equal = this.compareResults(projects[row].development, projects[row].staging, projects[row].production);
      projects[row].result = is_equal ? 2 : 1;
    }
    this.setState({ projects });
  }

  updateResult = (row, column, result, projects) => {
    if (!projects[row][column]) {
      return projects;
    }
    projects[row][column]['error'] = result.error;
    projects[row][column]['text'] = result.text;
    return projects;
  }

  hasError = (a, b, c) => {
    return (a && a.error) || (b && b.error) || (c && c.error);
  }

  compareResults = (a, b, c) => {
    const a_b = (a && b) ? (a.text === b.text) : true;
    const a_c = (a && c) ? (a.text === c.text) : true;
    const b_c = (b && c) ? (b.text === c.text) : true;
    return a_b && a_c && b_c;
  }

  renderLink = (cellInfo) => {
    const cell = this.state.projects[cellInfo.index][cellInfo.column.id] || {};
    return (
      <a
        onClick={(e) => {
          e.preventDefault();
          this.triggerLink(cellInfo.index, cellInfo.column.id)
        }}
        href={ cell.url || "" }
        rel="noopener noreferrer"
        target="_blank">
        { cellInfo.value }
      </a>
    )
  }

  getLinkStatus(row, column) {
    const projects = [...this.state.projects];
    const cell = projects[row][column];
    if (!cell || !cell.url) {
      return new Promise((resolve, _) => resolve({ text: '', error: false }));
    }
    cell.text = 'Loading...';

    this.setState({ projects });

    return fetch(cell.url)
    .then((r) => {
      if (!r.ok) {
          throw Error(`${r.status} - ${r.statusText}`);
      }
      return r.json();
    })
    .then((body) => {
      return {
        text: body.branch || body.version || body.status,
        error: false
      };
    })
    .catch((e) => {
        let err_str = e.toString()

        if (e instanceof TypeError) {
            err_str = "Cors Disabled";
        }

        return {
          text: err_str,
          error: true
        };
    });
  }

  render() {
    return (
        <div>
          <div>
            <div className="spliced">
              <form onSubmit={this.handleSubmit} method="GET">
                <label rel="config">Configuration url:</label>
                <input
                  onChange={(event) => this.setState({config_url: event.target.value})}
                  id="config-url"
                  name="config"
                  value={this.state.config_url}
                />
                <button type="submit">
                  Load
                </button>
              </form>
            </div>
            <div className="spliced">
            <label rel="config">Example:</label>
            <a href={this.state.default_config_url} rel="noopener noreferrer" target="_blank">{this.state.default_config_url}</a>
            </div>
          </div>
      <ReactTable
        data={this.state.projects}
        loading={this.state.loading}
        defaultFilterMethod={(filter, row, column) => {
          const id = filter.pivotId || filter.id
          return row[id] !== undefined ? String(row[id]).toUpperCase().indexOf(filter.value.toUpperCase()) > -1 : true
        }}
        getTrProps={(state, rowInfo, column) => {
          let className = '';
          if (rowInfo && rowInfo.original && rowInfo.original.result !== undefined) {
            switch(rowInfo.original.result) {
              case 0:
                  className = 'row-offline';
                  break;
                case 1:
                    className = 'row-differ';
                    break;
                case 2:
                    className = 'row-online';
                    break;
                default:
            }
          }
          return { className };
        }}
        getTdProps={_ => {
          return { style: { lineHeight: "1.7em" } };
        }}
        // resolveData={data => data.map(row => row)}
        columns={[
          {
            Header: 'Name',
            accessor: 'name',
            width: 200,
            Cell: cellInfo => {
              if (cellInfo.original && cellInfo.original.disabled) {
                return (
                  <del>
                  {cellInfo.value}
                  </del>
                )
              }
              return cellInfo.value;
            },
          }, {
            Header: () => {
              return (
                <button onClick={(e) => {
                    [...this.state.projects].map((el, i) => this.triggerRowLinks(i));
                  }}>
                  call
                </button>
              );
            },
            width: 50,
            Cell: cellInfo => {
              if (cellInfo.original && cellInfo.original.disabled) {
                return (<span></span>);
              }
              return (
                <button onClick={() => {
                  this.triggerRowLinks(cellInfo.index);
                }}>
                  call
                </button>
              )
            },
          }, {
            Header: 'Result',
            accessor: 'result',
            width: 66,
          }, {
            id: 'development',
            Header: 'Development',
            accessor: d => (d.development && (d.development.text || d.development.url)),
            Cell: this.renderLink
          }, {
            id: 'staging',
            Header: 'Staging',
            accessor: d => (d.staging.text || d.staging.url),
            Cell: this.renderLink
          }, {
            id: 'production',
            Header: 'Production',
            accessor: d => (d.production.text || d.production.url),
            Cell: this.renderLink

          }
        ]}
        filterable={true}
        minRows={5}
        // showPagination={false}
        defaultPageSize={50}
        pageSize={150}
        onFetchData={(state, instance) => {
            if (this.state.projects.length > 0) {
                return
            }
            this.handleSubmit();
          }}
      />
      </div>
    );

  }
}

export default Table;
