import React from 'react';
import ReactTable from 'react-table';
import 'react-table/react-table.css';
import './table.css';

import { createBrowserHistory } from 'history';

class Table extends React.Component {
  constructor(props) {
    super(props);
    const urlParams = new URLSearchParams(window.location.search);
    const default_config_url = 'https://demo5025930.mockable.io/snippet';
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

    projects = this.updateText(row, column, result.text, projects);
    projects[row].result = result.error ? 0 : this.compareResults(projects[row].staging, projects[row].production);
    this.setState({ projects });
  }

  triggerRowLinks = async (row) => {
    let projects = [...this.state.projects];

    const [stg_result, prd_result] = await Promise.all([
      this.getLinkStatus(row, 'staging'),
      this.getLinkStatus(row, 'production'),
    ]);

    // console.log(stg_result, prd_result)
    projects = this.updateText(row, 'staging', stg_result.text, projects);
    projects = this.updateText(row, 'production', prd_result.text, projects);
    projects[row].result = (stg_result.error || prd_result.error) ? 0 : this.compareResults(stg_result, prd_result);
    // console.log(stg_result, prd_result, projects[row]['status']);
    this.setState({ projects });
  }

  updateText = (row, column, text, projects) => {
    projects[row][column]['text'] = text;
    return projects;
  }

  compareResults = (a, b) => {
    if (a.text === b.text) {
      return 2;
    }
    return 1;
  }

  renderLink = (cellInfo) => {
    const cell = this.state.projects[cellInfo.index][cellInfo.column.id];
    return (
      <a
        onClick={(e) => {
          e.preventDefault();
          this.triggerLink(cellInfo.index, cellInfo.column.id)
        }}
        href={ cell.url }
        rel="noopener noreferrer"
        target="_blank">
        { cellInfo.value }
      </a>
    )
  }

  getLinkStatus(row, column) {
    const projects = [...this.state.projects];
    const cell = projects[row][column];
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
        // resolveData={data => data.map(row => row)}
        columns={[
          {
            Header: 'Name',
            accessor: 'name',
            width: 200
          }, {
            Header: () => <button>call</button>,
            width: 50,
            Cell: cellInfo => {
              return (
                <button onClick={() => {
                  this.triggerRowLinks(cellInfo.index);
                }}>
                  call
                </button>
              )
            },
            getHeaderProps: (state, rowInfo, column, instance) => {
              return {
                onClick: (e) => {
                  [...this.state.projects].map((el, i) => this.triggerRowLinks(i));
                },
              }
            }
          }, {
            Header: 'Result',
            accessor: 'result',
            width: 66,
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
