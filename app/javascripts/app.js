
function setStatus(message) {
  var status = document.getElementById("status");
  status.innerText = message;
};


function refreshBalances(splitterAddress) {
  var splitterDiv = document.getElementById('contract');
  var account0Div = document.getElementById('account0');
  var account1Div = document.getElementById('account1');
  var account2Div = document.getElementById('account2');
  splitterDiv.innerText = web3.eth.getBalance(splitterAddress);
  account0Div.innerText = web3.eth.getBalance(web3.eth.accounts[0].toString(10));
  account1Div.innerText = web3.eth.getBalance(web3.eth.accounts[1].toString(10));
  account2Div.innerText = web3.eth.getBalance(web3.eth.accounts[2].toString(10));

}

function split() {
  
  // Get a Splitter instance
  split = Splitter.deployed(web3.eth.accounts[1], web3.eth.accounts[2]);

  // Copy in the nice-little function that will deal with the transaction delay  
  web3.eth.getTransactionReceiptMined = function (txnHash, interval) {
      var transactionReceiptAsync;
      interval = interval ? interval : 500;
      transactionReceiptAsync = function(txnHash, resolve, reject) {
          try {
              var receipt = web3.eth.getTransactionReceipt(txnHash);
              if (receipt == null) {
                  setTimeout(function () {
                      transactionReceiptAsync(txnHash, resolve, reject);
                  }, interval);
              } else {
                  resolve(receipt);
              }
          } catch(e) {
              reject(e);
          }
      };

      if (Array.isArray(txnHash)) {
          var promises = [];
          txnHash.forEach(function (oneTxHash) {
              promises.push(web3.eth.getTransactionReceiptMined(oneTxHash, interval));
          });
          return Promise.all(promises);
      } else {
          return new Promise(function (resolve, reject) {
                  transactionReceiptAsync(txnHash, resolve, reject);
              });
      }
  };

  
  // Update the UI with the starting balances and statii
  refreshBalances(split.address);
  setStatus('Calling Splitter.split() . . . ');
  
  // Do the split
  split.split(web3.eth.accounts[1], web3.eth.accounts[2], { from: web3.eth.accounts[0], value: web3.toWei(1) })
    .then(function (txn) {
      setStatus("Checking Transaction " + txn + ' . . . ');
      return web3.eth.getTransactionReceiptMined(txn);
    })
    .then(function (receipt) {
      setStatus('Receipt received.  receipt.gasUsed = ' + receipt.gasUsed + '.  ');
      refreshBalances(split.address);
      setStatus('All Done');
    })
    .catch(function (e) {
      setStatus('There was an error in Splitter.split() - ' + e.message);
    });

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

    split();

  });
}
