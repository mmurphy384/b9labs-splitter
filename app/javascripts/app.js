//-------------------------------------------
// Create a few global variables to make life
// a little eaiser
//-------------------------------------------
var accounts = [];
var account0Div;
var account1Div;
var account2Div;

function setStatus(message) {
  var status = document.getElementById("status");
  status.innerText = message;
};

function refreshBalances() {
  account0Div.innerText = web3.eth.getBalance(accounts[0]);
  account1Div.innerText = web3.eth.getBalance(accounts[1]);
  account2Div.innerText = web3.eth.getBalance(accounts[2]);
}

function splitWei(amount) {

  split = Splitter.deployed();
  console.log("Splitter Contract is Deployed.  Address = " + split.address);

  split.split({ from: web3.eth.accounts[0], value: amount })
    .then(function (txn) {
      return web3.eth.getTransactionReceiptMined(txn);
    })
    .then(function (receipt) {
      return  web3.eth.getBalance(accounts[0]);
    })
    .then(function (_balance) {
      account0Div.innerText = _balance;
      return  web3.eth.getBalance(accounts[1]);
    })
    .then(function (_balance) {
      account1Div.innerText = _balance;
      return  web3.eth.getBalance(accounts[2]);
    })
    .then(function (_balance) {
      account2Div.innerText = _balance;
    })
    .catch(function (e) {
      console.log('There was an error in Splitter.split() - ' + e.message);
    });
 }

window.onload = function() {

  //--------------------------------------
  // Copy in the nice-little function that 
  // will deal with the transaction delay
  //--------------------------------------
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

 account0Div = document.getElementById('account0');
 account1Div = document.getElementById('account1');
 account2Div = document.getElementById('account2');
  
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
    refreshBalances(accs);
  });
  
  document.getElementById('btn-split-10').addEventListener('click', function() {
    setStatus("Starting Split");
    splitWei(10);
  });  
  
  document.getElementById('btn-split-9').addEventListener('click', function() {
    setStatus("Starting Split");
    splitWei(9);
  });  

}