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
    this.renderEditable = this.renderEditable.bind(this);
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
            projects: d['projects'].map(project => ({ ...project, status: '' }))
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

  renderEditable(cellInfo) {
    return (
      <a 
        href="#" 
        onClick={async (e) => {
          e && e.preventDefault();

          const projects = [...this.state.projects];
          const cell = projects[cellInfo.index][cellInfo.column.id];

          const result = await this.getLinkStatus(cell.status);

          projects[cellInfo.index][cellInfo.column.id]['text'] = result.text;
          
          const hlg = projects[cellInfo.index]['hlg']['text'];
          const prd = projects[cellInfo.index]['prd']['text'];

          let status = 'differ';

          if (result.error) {
            status = 'offline';
          } else if (hlg === prd) {
            status = 'online';
          }

          projects[cellInfo.index]['status'] = status;
          this.setState({ projects });
        }}  
        target="_blank">
        { cellInfo.value }
      </a>
    );
  }

  getLinkStatus(url) {
    return fetch(url)
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
          // console.log('rowState', state)
          console.log('rowInfo', rowInfo)

          let className = '';

          if (rowInfo && rowInfo.original && rowInfo.original.status) {
            return {
              className: `row-${rowInfo.original.status}`
            }
          }

          return { className };
        }}
        getTdProps={(state, rowInfo, column, instance) => {
          if (rowInfo) {
            console.log('A Td state ', state)
            console.log('It was in this column:', column)
          }
          return {
            // onClick: (e, handleOriginal) => {
            //   console.log('A Td Element was clicked!')
            //   console.log('it produced this event:', e)
            //   console.log('It was in this column:', column)
            //   console.log('It was in this row:', rowInfo)
            //   console.log('It was in this table instance:', instance)
      
            //   // IMPORTANT! React-Table uses onClick internally to trigger
            //   // events like expanding SubComponents and pivots.
            //   // By default a custom 'onClick' handler will override this functionality.
            //   // If you want to fire the original onClick handler, call the
            //   // 'handleOriginal' function.
            //   if (handleOriginal) {
            //     handleOriginal()
            //   }
            // }
          }
        }}
        resolveData={data => data.map(row => row)}
        columns={[
          {
            Header: 'Name',
            accessor: 'name', // String-based value accessors!
            width: 150,
          }, {
            Header: () => <button>Call</button>,
            width: 50,
            Cell: props => <button>call</button>
          }, {
            Header: 'Result',
            accessor: 'result',
            width: 66,
          }, {
            id: 'hlg', // Required because our accessor is not a string
            Header: 'HLG',
            // accessor: 'hlg.text',
            accessor: d => (d.hlg.text || d.hlg.status), // Custom value accessors!
            Cell: this.renderEditable
            // Cell: (row) => {
            //   const updateRow = () => {
            //     // row.classList.remove('row-online', 'row-offline', 'row-differ')
            //     // row.classList.add('row-online');
            //     console.log('row', row);
            //     // row.classes.add('row-online');

            //     // row.classes[0] = 'row-online'
            //     // row.classes[1] = 'row-online'
            //     // row.classes[2] = 'row-online'
            //     console.log('...', row.state);
            //     console.log(row.classes);
            //     const state = this.state
            //     this.setState(state)
            //   }
            //   return (<Link updateRow={updateRow} href={row.value}>{row.value}</Link>)
            // }
          }, {
            id: 'prd', // Required because our accessor is not a string
            Header: 'PRD',
            // accessor: 'prd.text',
            accessor: d => (d.prd.text || d.prd.status), // Custom value accessors!
            // accessor: d => d.hlg.status // Custom value accessors!
            // Cell: props => <Link href={props.value}>{props.value}</Link>
            Cell: this.renderEditable

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