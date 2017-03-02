
 

 
//-------------------------------------------
// Create a few global variables to make life
// a little eaiser
//-------------------------------------------
var accounts = [];
var accountSplitDiv;
var account0Div;
var account1Div;
var account2Div;
var networkDiv;
var transferDiv;
var instance;

function setStatus(message) {
  var status = document.getElementById("status");
  status.innerText = message;
};

function refreshBalances() {
  accountSplitDiv.innerText = web3.eth.getBalance(instance.address);  
  account0Div.innerText = web3.eth.getBalance(accounts[0]);
  account1Div.innerText = web3.eth.getBalance(accounts[1]);
  account2Div.innerText = web3.eth.getBalance(accounts[2]);
}

function splitWei(amount) {

  instance.split({ from: web3.eth.accounts[0], value: amount })
    .then(function (txn) {
      console.log("Transaction Hash Received (" + txn + ")");
      return web3.eth.getTransactionReceiptMined(txn);
    })
    .then(function (receipt) {
      console.log("Transaction Mined (gasUsed = " + receipt.gasUsed + ")");
      return  web3.eth.getBalance(accounts[0]);
    })
    .then(function (_balance) {
      console.log("Alice's balance was received (" + _balance + ")");
      account0Div.innerText = _balance;
      return  web3.eth.getBalance(accounts[1]);
    })
    .then(function (_balance) {
      console.log("Bob's balance was received (" + _balance + ")");
      account1Div.innerText = _balance;
      return  web3.eth.getBalance(accounts[2]);
    })
    .then(function (_balance) {
      console.log("Carol's balance was received (" + _balance + ") Address = " + accounts[2]);
      account2Div.innerText = _balance;
    })
    .catch(function (e) {
      console.log('There was an error in Splitter.split() - ' + e.message);
    });
 }

window.onload = function() {

 //----------------------------------------------------------  
 // Set global div variables
 //----------------------------------------------------------  
  accountSplitDiv = document.getElementById('account-split');
  account0Div = document.getElementById('account-0');
  account1Div = document.getElementById('account-1');
  account2Div = document.getElementById('account-2');
  transferDiv = document.getElementById('transfer-log');

  document.getElementById('btn-split-10').addEventListener('click', function() {
    setStatus("Starting Split");
    splitWei(10);
  });  

  document.getElementById('btn-split-9').addEventListener('click', function() {
    setStatus("Starting Split");
    splitWei(9);
  });  


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


  web3.eth.getAccounts(function(err, accs) {
    if (err != null) {
      setStatus("There was an error fetching your accounts.");
      return;
    }

    if (accs.length == 0) {
      setStatus("Couldn't get any accounts! Make sure your Ethereum client is configured correctly.");
      return;
    }
    accounts = accs;
    refreshBalances();
  });


  instance = Splitter.deployed();
  
  logSplits();
  logTransfers();


}

function logSplits() {
  instance.onSplit()
    .watch(function(e, value) {
      if (e)
        console.error(e);
      else
        setStatus(value.args.weiTotal + " wei sent from " + value.args.sender + " to split(). " +
                    value.args.weiToAddr1 + " wei to Bob and " +
                    value.args.weiToAddr2 + " wei to Carol");
      refreshBalances();
    });
}

function logTransfers() {
  instance.onTransfer()
    .watch(function(e, value) {
      if (e)
        console.error(e);
      else {
        var newItem = document.createElement("LI");     
        var textnode = document.createTextNode(value.args.value + " wei sent from " + value.args.sender + " - to -  " + value.args.receiver);  // Create a text node
        newItem.appendChild(textnode);        
        transferDiv.insertBefore(newItem, transferDiv.childNodes[0]);  
      }
    });
}