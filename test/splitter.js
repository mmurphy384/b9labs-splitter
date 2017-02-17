contract('Splitter', function () {
	// This function is used to help deal with the delay associated with mining.
	// I'm not sure if I have to add this within the function or not.
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

	describe("Basic Tests", function () {
		before("Deploy and Prepare", function () {
		});
		it("should verify that the max number of accounts in the splitter is 2", function () {
			var split = Splitter.deployed();
			split.maxAccounts.call().then(function (_result) {
				assert.equal(_result, 2, "The maximum number of accounts is " + _result);
			});		
		});
	});


	it("should add two accounts and prevent a third from being added.", function () {
		var split = Splitter.deployed();
		split.maxAccounts.call().then(function(_result){maxAccounts = _result;});
		split.addMyAccount({ from: web3.eth.accounts[1] });
		split.addMyAccount({ from: web3.eth.accounts[2] })
			.then(function (_txHash) {
				web3.eth.getTransactionReceiptMined(_txHash)
					.then(function () { 
						split.getNumAccounts.call().then(function (_result) {
							assert.equal(_result, 2, "The number of accounts is " + _result); 
						});							
					});
			});
	});

	it("Should perform the split function properly, sending half to Bob/Carol.", function () {
		var sendAmount = 4;
		var half = web3.toWei(sendAmount) / 2;
		var otherHalf = web3.toWei(sendAmount) - half;
		var bobStartBalance;
		var bobEndBalance;
		var bobExpectedEndBalance;
		var carolStartBalance;
		var carolEndBalance;
		var carolExpectedEndBalance;

		// Initialize the contract and add 2 accounts to the contract
		var split = Splitter.deployed();
		split.addMyAccount({ from: web3.eth.accounts[1] });
		split.addMyAccount({ from: web3.eth.accounts[2] });

		return split.getMyBalance.call({ from: web3.eth.accounts[1] }).then(function (_balance10) {
			// set bobs initial balance
			bobStartBalance = _balance10.toNumber();
			bobExpectedEndBalance = bobStartBalance + half;
			return split.getMyBalance.call({ from: web3.eth.accounts[2] });
		}).then(function (_balance20) {
			// set carols initial balance and start the split.
			carolStartBalance = _balance2.toNumber();
			carolExpectedEndBalance = carolStartBalance + otherHalf;
			return split.split({ from: web3.eth.accounts[0], value: web3.toWei(sendAmount) })
		}).then(function (txHash) {
			// wait for the split to happen
			return web3.eth.getTransactionReceiptMined(txHash);
		}).then(function (receipt) { 
			return split.getMyBalance.call({ from: web3.eth.accounts[1] });
		}).then(function (_balance11) { 
			// get bob's final balance
			bobEndBalance = _balance11.toNumber();
			return split.getMyBalance.call({ from: web3.eth.accounts[2] });
		}).then(function (_balance22) { 
			// get carol's final balance and do the assertions.
			carolEndBalance = _balance22;
			assert.equal(bobEndBalance, bobExpectedEndBalance, "Bob received his half");
			assert.equal(carolEndBalance, carolExpectedEndBalance, "Carol receive her half ");
		});
	});


});


