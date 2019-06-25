import React from 'react';
import ReactTable from 'react-table';
import 'react-table/react-table.css';
import Link from './link';
import './table.css';

class Table extends React.Component {
  constructor(props) {
    super(props);
    this.state = { data: [], projects: [], config_url: 'http://demo5025930.mockable.io/snippet', loading: false };
    // this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.updateRow = this.updateRow.bind(this);
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
        console.log(d['projects']);
        this.setState({
            projects: d['projects']
        });
        console.log(this.state.projects);
    })
    .catch((e) => {
        let err_str = e.toString()
        if (e instanceof TypeError) {
            err_str = "Cors Disabled"
        }
        console.error("Nonon", err_str, e);
    })
    .finally(() => {
        this.setState({loading: false});
    });
  }

  updateRow(error) {
      this.setState({
          error,
      })
  }


  render() {
      const columns = [
      {
        Header: 'Name',
        accessor: 'name', // String-based value accessors!
        width: 150,
      }, {
        // Header: 'Call',
        width: 50,
        Cell: props => <button>call</button>
      }, {
        Header: 'Result',
        accessor: 'result',
        width: 66,
      }, {
        id: 'hlg', // Required because our accessor is not a string
        Header: 'HLG',
        accessor: 'hlg.status',
        // accessor: d => d.hlg.status // Custom value accessors!
        Cell: row => <Link href={row.value}>{row.value}</Link>
      }, {
        id: 'prd', // Required because our accessor is not a string
        Header: 'PRD',
        accessor: 'prd.status',
        // accessor: d => d.hlg.status // Custom value accessors!
        Cell: props => <Link href={props.value}>{props.value}</Link>
      }
    ]


    return (
        <div>
      <form onSubmit={this.handleSubmit}>
        <input
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
        // resolveData={data => data.map(row => row)}
        columns={columns}
        filterable="true"
        showPagination=""
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