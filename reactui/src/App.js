import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import Web3 from 'web3';


var client = new Web3(new Web3.providers.HttpProvider("http://52.87.228.0:8545"));
var splitterAbi = [{ "constant": true, "inputs": [{ "name": "_name", "type": "string" }], "name": "getBalance", "outputs": [{ "name": "", "type": "uint256" }], "payable": false, "type": "function" }, { "constant": false, "inputs": [{ "name": "_name", "type": "string" }, { "name": "_addr", "type": "address" }], "name": "updateAddress", "outputs": [{ "name": "", "type": "address" }], "payable": false, "type": "function" }, { "constant": false, "inputs": [], "name": "killMe", "outputs": [{ "name": "", "type": "bool" }], "payable": false, "type": "function" }, { "constant": true, "inputs": [{ "name": "_name", "type": "string" }], "name": "getAddress", "outputs": [{ "name": "", "type": "address" }], "payable": false, "type": "function" }, { "constant": false, "inputs": [], "name": "resurrect", "outputs": [{ "name": "", "type": "address" }], "payable": false, "type": "function" }, { "constant": false, "inputs": [], "name": "split", "outputs": [], "payable": true, "type": "function" }, { "inputs": [{ "name": "_address1", "type": "address" }, { "name": "_address2", "type": "address" }], "payable": false, "type": "constructor" }, { "payable": true, "type": "fallback" }, { "anonymous": false, "inputs": [{ "indexed": false, "name": "sender", "type": "address" }, { "indexed": false, "name": "receiver", "type": "address" }, { "indexed": false, "name": "value", "type": "uint256" }, { "indexed": false, "name": "timeStamp", "type": "uint256" }], "name": "logTransfers", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": false, "name": "addr1", "type": "address" }, { "indexed": false, "name": "addr2", "type": "address" }, { "indexed": false, "name": "amount1", "type": "uint256" }, { "indexed": false, "name": "amount2", "type": "uint256" }, { "indexed": false, "name": "timeStamp", "type": "uint256" }], "name": "logSplit", "type": "event" }];

var splitterAddress = '0x88a6b2eb396d077a08bd56283e6d14bf1740acee'
var instance = client.eth.contract(splitterAbi).at(splitterAddress);


class App extends Component {

  constructor(props) {   
    super(props)
    this.state = {
      address1: [],
      address2: [],
      amount1: [],
      amount2: []
    }
  }  

  componentWillMount() { 
    
    instance.logSplit(
      { fromBlock: 0 }) 
    .watch(function (error, value) {
      if (error) {
        console.error(error);
      } else {
        console.log(value.args._value);
        this.setState({
          address1: value.addr1,
          address2: value.addr2,
          amount1: value.amount1.toNumber(),
          amount2: value.amount2.toNumber()
        });
      }
    });
  }

  render() {
    return (
      <div className="App">
        <div className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h2>Welcome to React</h2>
        </div>
        <p className="App-intro">
          To get started, edit <code>src/App.js</code> and save to reload.
        </p>
        <div className="App-content">
          <pre>TimeStamp</pre>
          <pre>Address1</pre>
          <pre>Address2</pre>
          <pre>Amount1</pre>
          <pre>Amount2</pre>
        </div>
      </div>
    );
  }
}

export default App;
