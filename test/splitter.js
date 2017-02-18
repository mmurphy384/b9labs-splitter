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

	describe("Splitter Tests", function () {
		
		var instance;
		var numAccounts = 0;
		
		beforeEach("Deploy and make sure there are 2 accounts and get the address and starting balances.", function () {
			instance = Splitter.deployed();
			var split = Splitter.at(instance.address);
			return split.addMyAccount('bob', { from: web3.eth.accounts[1] })
			.then(function (_txHash) {
				// wait for it to happen	
				return web3.eth.getTransactionReceiptMined(_txHash);
			}).then(function () {
				return split.addMyAccount('carol', { from: web3.eth.accounts[2] });
			}).then(function (_txHash) {
				// wait for it to happen
				return web3.eth.getTransactionReceiptMined(_txHash);
			}).then(function () {
				return split.getNumAccounts.call();
			}).then(function (_result) {
				numAccounts = _result;
			});
		});

		// it("should verify that 2 accoutns exist in the contract.", function () {
 		// 	assert.equal(numAccounts, 2, "The actual number of accounts is " + numAccounts);
		// });
		
		it("Should perform the split function properly, sending half to Bob/Carol.", function () {
			var name1 = "bob";
			var name2 = "carol";
			var sendAmount = 1;
			var half = web3.toWei(sendAmount) / 2;
			var otherHalf = web3.toWei(sendAmount) - half;
			var name1StartBalance = 0;
			var name2StartBalance = 0;
			var name1StartBalance;
			var name1EndBalance;
			var name1ExpectedEndBalance;
			var name2StartBalance;
			var name2EndBalance;
			var name2ExpectedEndBalance;

			// Initialize the contract and add 2 accounts to the contract
			var split = Splitter.at(instance.address);
			assert.equal(split.address, instance.address, "Addresses are correct");
			assert.equal(numAccounts, 2, "The actual number of accounts is " + numAccounts);
			return split.getMyBalance.call(name1).then(function (_balance10) {
				// set name1s initial balance
				name1StartBalance = _balance10.toNumber();
				name1ExpectedEndBalance = name1StartBalance + half;
				return split.getMyBalance.call(name2);
			}).then(function (_balance20) {
				// set carols initial balance and start the split.
				name2StartBalance = _balance20.toNumber();
				name2ExpectedEndBalance = name2StartBalance + otherHalf;
				return split.split(name1, name2, { from: web3.eth.accounts[0], value: web3.toWei(sendAmount) });
			}).then(function (txHash) {
				// wait for the split to happen
				return web3.eth.getTransactionReceiptMined(txHash);
			}).then(function (receipt) { 
				assert.equal(1, 1, "Split Receipt received");	
				return split.getMyBalance.call(name1);
			}).then(function (_balance11) { 
				// get name1's final balance
				name1EndBalance = _balance11.toNumber();
				return split.getMyBalance.call(name2);
				}).then(function (_balance22) {
					// get carol's final balance and do the assertions.
					name2EndBalance = _balance22;
			}).then(function () {
				assert.equal(name1EndBalance, name1ExpectedEndBalance, name1 + " received its half");
				assert.equal(name2EndBalance, name2ExpectedEndBalance, name2 + " received its half ");
			});
		});
	});
});


