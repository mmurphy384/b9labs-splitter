import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import Web3 from 'web3';
import _ from 'lodash';


var client = new Web3(new Web3.providers.HttpProvider("http://52.87.228.0:8545"));
var splitterAbi = [{"constant":true,"inputs":[{"name":"_index","type":"uint256"}],"name":"getBalance","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[],"name":"killMe","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":false,"inputs":[],"name":"split","outputs":[],"payable":true,"type":"function"},{"inputs":[{"name":"_address1","type":"address"},{"name":"_address2","type":"address"}],"payable":false,"type":"constructor"},{"payable":true,"type":"fallback"},{"anonymous":false,"inputs":[{"indexed":false,"name":"sender","type":"address"},{"indexed":false,"name":"receiver","type":"address"},{"indexed":false,"name":"value","type":"uint256"},{"indexed":false,"name":"timeStamp","type":"uint256"}],"name":"onTransfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"sender","type":"address"},{"indexed":false,"name":"weiTotal","type":"uint256"},{"indexed":false,"name":"weiToAddr1","type":"uint256"},{"indexed":false,"name":"weiToAddr2","type":"uint256"},{"indexed":false,"name":"timestamp","type":"uint256"}],"name":"onSplit","type":"event"}];

var splitterAddress = '0xf6f9f38ebe21283ea887c6c5e7901469e4b925cb'
var instance = client.eth.contract(splitterAbi).at(splitterAddress);



class App extends Component {

  constructor(props) {
    super(props)
    this.state = {
      names: [],
      addresses: [],
      balances: []
    }
  }

  componentWillMount() {

    // Read in the arrays of data
    // This should really read from the events
    var _names = ['Alice', 'Bob', 'Carol'];
    var _addresses = client.eth.accounts;
    var _balances = [];
    for (var i = 0; i < _addresses.length; i++) {
      _balances.push(instance.getBalance.call(i));
    }

    // set the state
    this.setState({
      names: String(_names).split(','),
      addresses: String(_addresses).split(','),
      balances: String(_balances).split(',')
    })
  }


  handleClick(event) {
    //const {id} = event.target;
    var txHash = instance.split({ from: client.eth.accounts[0], value:10 });
    console.log("Split Hash = " + txHash);
    //for (var i = 0; i < this.state.balances.length; i++) {
    //  this.state.balances[i] = instance.getBalance.call(i);
    //}  
  }

  render() {

    var Rows = [];
    _.each(this.state.balances, (value, index) => {
      Rows.push(
        <tr>
          <td>{this.state.names[index]}</td>
          <td>{this.state.addresses[index]}</td>
          <td>{this.state.balances[index]}</td>
        </tr>
      );
    });

    return (
      <div className="App">
        <div className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h2>Mike Murphy's Splitter Contract - In ReactJs!</h2>
        </div>
        <p className="App-intro">
          This page shows a real time monitoring of 3 account balances.
        </p>
        <div className="App-content">
          <center>
            <table>
              <thead>
                <th>Name</th>
                <th>Account</th>
                <th>Balance</th>
              </thead>
              <tbody>
                {Rows}
              </tbody>
            </table>
            <br />
            <hr />
            <button name="Split" id="btn-split" onClick={this.handleClick}>Split 10 Wei</button>
          </center>
        </div>
      </div>
    );
  }
}

export default App;
