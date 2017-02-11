var accounts;
var account;

function split() {
  
  split = Splitter.deployed(accounts[1],accounts[2]);

  console.log("Calling Splitter");
  split.split(1000000);
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

    refreshBalances('pre-split');
    split();
    refreshBalances('post-split');

  });
}

