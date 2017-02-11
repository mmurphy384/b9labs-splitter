var accounts;
var account;

function getBasicInfo(prefix) {

  console.log('------------------------------')
  console.log('---------' + prefix + '----------');
  //console.log(prefix + ': web3.eth.accounts = ' + web3.eth.accounts);
  console.log(prefix + ': web3.eth.mining = ' + web3.eth.mining);
  console.log(prefix + ': Alice (eth.coinbase): web3.eth.getBalance(accounts[' + web3.eth.accounts[0] + ']) = ' + web3.eth.getBalance(accounts[0]).toString(10));
  console.log(prefix + ': Bob: web3.eth.getBalance(accounts[' + web3.eth.accounts[1] + ']) = ' + web3.eth.getBalance(accounts[1]).toString(10));
  console.log(prefix + ': Carol: web3.eth.getBalance(accounts[' + web3.eth.accounts[2] + ']) = ' + web3.eth.getBalance(accounts[2]).toString(10));
  console.log('------------------------------')

}

 
function split() {
  
  split = Splitter.deployed(web3.eth.accounts[1], web3.eth.accounts[2]);
  console.log('------------------------------')
  console.log('---------Splitter----------');
  console.log('splitting: split.address = ' + split.address);
  console.log('splitting: web3.eth.getBalance(accounts[' + split.address + ']) = ' + web3.eth.getBalance(split.address));
  //console.log('splitting: sending gas to the contract: web3.eth.sendTransaction({ from: web3.eth.accounts[0], to: split.address, value: web3.toWei(1, "finney") });');
  //var txn = web3.eth.sendTransaction({ from: web3.eth.accounts[0], to: split.address, value: web3.toWei(1, "finney") });
  //console.log("splitting: web3.eth.getTransactionReceipt(txHash).gatUsed = " + web3.eth.getTransactionReceipt(txn).gasUsed);
  //console.log('splitting: web3.eth.getBalance(accounts[split.addres]) = ' + web3.eth.getBalance(split.address));
  console.log("splitting: Calling split.split.call(web3.eth.accounts[1], web3.eth.accounts[2],50000,{from: web3.eth.accounts[0]})");
  split.split.call(web3.eth.accounts[1], web3.eth.accounts[2],50000,{from: web3.eth.accounts[0]});
  console.log("splitting: Everything is split() .. . but. .. not really because the balances didn't change because bob and carols addresses are messed up (even though they are passed into split() and set there) ");
  console.log('------------------------------')

  console.log('------------------------------')
  console.log('---------Confirm Addresses----------');
  split.bob.call().then(function (_result) { console.log('splitting: Bobs Address: split.bob.call() = ' + _result); }).catch(function (e) { console.error(e); });
  split.carol.call().then(function (_result) { console.log('splitting: Carols Address: split.carol.call() = ' + _result); }).catch(function (e) { console.error(e); });
  console.log('------------------------------')

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
