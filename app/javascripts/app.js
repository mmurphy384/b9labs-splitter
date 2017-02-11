var accounts;
var account;

function getBasicInfo(prefix) {

  console.log('------------------------------')
  console.log(prefix + ': web3.eth.accounts = ' + web3.eth.accounts);
  console.log(prefix + ': web3.eth.mining = ' + web3.eth.mining);
  console.log(prefix + ': web3.eth.getBalance(accounts[' + web3.eth.accounts[0] + ']) = ' + web3.eth.getBalance(accounts[0]));
  console.log(prefix + ': web3.eth.getBalance(accounts[' + web3.eth.accounts[1] + ']) = ' + web3.eth.getBalance(accounts[1]));
  console.log(prefix + ': web3.eth.getBalance(accounts[' + web3.eth.accounts[2] + ']) = ' + web3.eth.getBalance(accounts[2]));
  console.log('------------------------------')

}

 
function split() {
  
  split = Splitter.deployed(accounts[1],accounts[2]);
  console.log('splitting: split.address = ' + split.address);
  console.log('splitting: web3.eth.getBalance(accounts[' + split.address + ']) = ' + web3.eth.getBalance(split.address));
  console.log('splitting: sending gas to the contract: web3.eth.sendTransaction({ from: web3.eth.accounts[0], to: split.Address, value: web3.toWei(2, "ether") });')
  console.log(web3.eth.sendTransaction({ from: web3.eth.accounts[0], to: split.Address, value: web3.toWei(2, "ether") }));
  console.log('splitting: web3.eth.getBalance(accounts[' + split.address + ']) = ' + web3.eth.getBalance(split.address));
  console.log('splitting: split.bob.call() = ' + split.bob.call());
  console.log('splitting: split.bob.call() = ' + split.carol.call());
  console.log("Calling split");
  split.split(500000000);
  console.log("Everything is split");

}

function refreshBalances(prefix){
    web3.eth.getBalance(accounts[0], function (err, _balance) { console.log('balance0' + prefix + ' = ' + _balance.toString()); });
    web3.eth.getBalance(accounts[1], function (err, _balance) { console.log('balance1' + prefix + ' = ' + _balance.toString()); });
    web3.eth.getBalance(accounts[2], function (err, _balance) { console.log('balance2' + prefix + ' = ' + _balance.toString()); }); 
}

window.onload = function() {

  web3.eth.getAccounts(function(err, accs) {
    if (err != null) {
      alert("There was an error fetching your accounts.");
      return;
    }

    if (accs.length == 0) {
      alert("Couldn't get any accounts! Make sure your Ethereum client is configured correctly.");
      return;
    }
    
    accounts = accs;
    account = accounts[0];

    getBasicInfo('pre-split');
    split();
    getBasicInfo('post-split');

  });
}
