

//-------------------------------------------
// Create a few global variables to make life
// a little eaiser
//-------------------------------------------
var accounts = [];
var instance;

//--------------
// GUI functions
//--------------
function setStatus(message) {
  var status = document.getElementById("status");
  status.innerText = message;
}

function updateInnerText(id, text) { 
  document.getElementById(id).innerText = text;
}

//----------------------------
// Set listeners
//----------------------------
function initElements() {
    document.getElementById('btn-split-10').addEventListener('click', function() {
      setStatus("Starting Split");
      splitWei(10);
    });  
    document.getElementById('btn-split-9').addEventListener('click', function() {
      setStatus("Starting Split");
      splitWei(9);
    });  
    document.getElementById('btn-withdraw-1').addEventListener('click', function() {
      setStatus("Starting withdrawal for Bob");
      withdrawWei(1);
    });  
    document.getElementById('btn-withdraw-2').addEventListener('click', function() {
      setStatus("Starting withdraw for Carol");
      withdrawWei(2);
    });  
 }

//---------------------------------------------------------
// Splitter function to refresh balances and logWithdrawals
//---------------------------------------------------------
function refreshBalances() {
  updateInnerText('account-split', web3.eth.getBalance(instance.address));
  updateInnerText('account-0',web3.eth.getBalance(accounts[0]));
  updateInnerText('account-1',web3.eth.getBalance(accounts[1]));
  updateInnerText('account-2',web3.eth.getBalance(accounts[2]));
	return Promise.all([
					instance.getPendingFundsAmount(accounts[1]),
					instance.getPendingFundsAmount(accounts[2])
  ]).then(function (results) {
    updateInnerText('btn-withdraw-1', results[0].toNumber());
    updateInnerText('btn-withdraw-2', results[1].toNumber());
  }).catch(function (e) {
    console.log("There was an error: " + e);
  });
}

//---------------------------------------------------
// Splitter function to split the wei in the contract
//---------------------------------------------------
function splitWei(amount) {
  return instance.split({ from: web3.eth.accounts[0], value: amount })
    .then(function (txn) {
      console.log("Transaction Hash Received (" + txn + ")");
      return web3.eth.getTransactionReceiptMined(txn);
    })
    .then(function (receipt) {
      console.log("Transaction Mined (gasUsed = " + receipt.gasUsed + ")");
    })
    .catch(function (e) {
      console.log('There was an error in Splitter.split() - ' + e.message);
    });
   refreshBalances();
 }

//----------------------------------------------------------
// Splitter Function to withdraw wei to a particular account
//----------------------------------------------------------
function withdrawWei(accountIndex) {
  return instance.withdrawPendingFunds({from:accounts[accountIndex]})
    .then(function (txn) {
      console.log("Withdrawal Hash Received (" + txn + ")");
      return web3.eth.getTransactionReceiptMined(txn);
    })
    .then(function (receipt) {
      console.log("Withdrawal Processed. Receipt = " + receipt.toString());
    })
    .catch(function (e) {
      console.log('There was an error in Splitter.withdrawWei() - ' + e.message);
    });
  refreshBalances();
 }


//-----------------------------
// Let's make the magic happen
//-----------------------------
window.onload = function() {
  initElements();
  instance = Splitter.deployed();

  //---------------------------------------
  // Copy in the nice-little function that 
  // will deal with the transaction delay
  // TO DO: Find a better place to put this
  //---------------------------------------
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

  //---------------------------------------------
  // Load the available accounts and set balances
  //---------------------------------------------
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

  //----------------------------
  // Loggers
  //----------------------------
  logSplits();
  logWithdrawals();
}

function logSplits() {
  instance.onSplit()
  .watch(function(e, value) {
    if (e)
      console.error(e);
    else
      setStatus(value.args.weiTotal + " wei sent from " + value.args.sender + " to split(). " +
                  value.args.weiToAddress1 + " wei to Bob and " +
                  value.args.weiToAddress2 + " wei to Carol");
    refreshBalances();
  });
}

function logWithdrawals() {
  instance.onWithdrawPendingFunds()
  .watch(function(e, value) {
    if (e)
      console.error(e);
    else
      setStatus(value.args.weiTotal + " wei withdrawn to " + value.args.weiToWhom + ".");
    refreshBalances();
  });
}
