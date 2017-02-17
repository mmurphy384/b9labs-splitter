contract('Splitter', function () {

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
		
	var numStartingAccounts = 0;
	var numEndingAccounts = 0;
	var maxAccounts = 0;
	var txHash;

	it("should add two accounts and prevent a third from being added.", function () {
		var split = Splitter.deployed();
		split.maxAccounts.call().then(function(_result){maxAccounts = _result;});
		split.addMyAccount({ from: web3.eth.accounts[1] });
		split.addMyAccount({ from: web3.eth.accounts[2] }).then(function (_txHash) {
			txHash = _txHash;
		});

		// wait for the last transaction to get mined
		var result = web3.eth.getTransactionReceiptMined(txHash)
			.then(function () { 
				split.getNumAccounts.call().then(function (_result) {
					numEndingAccounts = _result;
				});							
			});

		//assert.equal(maxAccounts,2, "The maximum number of accounts is " + maxAccounts);
		assert.equal(numEndingAccounts, 2, "The number of accounts is " + numEndingAccounts);

	});
});
