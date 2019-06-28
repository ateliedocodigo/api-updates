import React from 'react';
import ReactTable from 'react-table';
import 'react-table/react-table.css';
import './table.css';

class Table extends React.Component {
  constructor(props) {
    super(props);
    this.state = { data: [], projects: [], config_url: 'http://demo5025930.mockable.io/snippet', loading: false };
    // this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.renderLink = this.renderLink.bind(this);
  }

  handleSubmit(e) {
    e && e.preventDefault();
    if (!this.state.config_url.length) {
      return;
    }

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
            projects: d['projects'].map(project => ({ ...project, status: '' }))
        });
        // console.log(this.state.projects);
    })
    .catch((e) => {
        let err_str = e.toString()
        if (e instanceof TypeError) {
          err_str = "Cors Disabled";
        }
        console.error("Nonon", err_str, e);
    })
    .finally(() => {
        this.setState({loading: false});
    });
  }

  triggerLink = async (row, column) => {
    let projects = [...this.state.projects];

    const result = await this.getLinkStatus(row, column);

    projects = this.updateText(row, column, result.text, projects);
    projects[row].status = result.error ? 0 : this.compareResults(projects[row].hlg, projects[row].prd);
    this.setState({ projects });
  }

  triggerRowLinks = async (row) => {
    let projects = [...this.state.projects];

    const [hlg_result, prd_result] = await Promise.all([
      this.getLinkStatus(row, 'hlg'),
      this.getLinkStatus(row, 'prd'),
    ]);

    // console.log(hlg_result, prd_result)
    projects = this.updateText(row, 'hlg', hlg_result.text, projects);
    projects = this.updateText(row, 'prd', prd_result.text, projects);
    projects[row]['status'] = (hlg_result.error || prd_result.error) ? 0 : this.compareResults(hlg_result, prd_result);
    // console.log(hlg_result, prd_result, projects[row]['status']);
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

  renderLink(cellInfo) {
    const cell = this.state.projects[cellInfo.index][cellInfo.column.id];
    return (
      <a 
        onClick={(e) => {
          e.preventDefault();
          this.triggerLink(cellInfo.index, cellInfo.column.id, 'prd')
        }}
        href={ cell.status } 
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

    return fetch(cell.status)
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
      <form onSubmit={this.handleSubmit}>
        <input
          readOnly
          id="config-url"
        //   onChange={this.handleChange}
          value={this.state.config_url}
        />
        <button>
          Load
        </button>
      </form>

      <ReactTable
        data={this.state.projects}
        loading={this.state.loading}
        defaultFilterMethod={(filter, row, column) => {
          const id = filter.pivotId || filter.id
          return row[id] !== undefined ? String(row[id]).toUpperCase().indexOf(filter.value.toUpperCase()) > -1 : true
        }}
        getTrProps={(state, rowInfo, column) => {
          let className = '';
          if (rowInfo && rowInfo.original && rowInfo.original.status !== undefined) {
            switch(rowInfo.original.status) {
              case 0:
                  className='row-offline';
                  break;
                case 1:
                    className='row-differ';
                    break;
                case 2:
                    className='row-online';
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
            accessor: 'name', // String-based value accessors!
            width: 150,
          }, {
            // Header: () => <button>Call</button>,
            width: 50,
            Cell: cellInfo => {
              return (
                <button onClick={() => {
                  this.triggerRowLinks(cellInfo.index);
                }}>
                  call
                </button>
              )
            }
          }, {
            Header: 'Result',
            accessor: 'result',
            width: 66,
          }, {
            id: 'hlg', // Required because our accessor is not a string
            Header: 'HLG',
            // accessor: 'hlg.text',
            accessor: d => (d.hlg.text || d.hlg.status), // Custom value accessors!
            Cell: this.renderLink
          }, {
            id: 'prd', // Required because our accessor is not a string
            Header: 'PRD',
            // accessor: 'prd.text',
            accessor: d => (d.prd.text || d.prd.status), // Custom value accessors!
            Cell: this.renderLink

          }
        ]}
        filterable={true}
        showPagination={false}
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