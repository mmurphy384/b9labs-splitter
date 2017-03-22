contract('Splitter', function (accounts) {
	// This function is used to help deal with the delay associated with mining.
	// I'm not sure if I have to add this within the function or not.
	web3.eth.getTransactionReceiptMined = function (txnHash, interval) {
		var transactionReceiptAsync;
		interval = interval ? interval : 500;
		transactionReceiptAsync = function (txnHash, resolve, reject) {
			try {
				var receipt = web3.eth.getTransactionReceipt(txnHash);
				if (receipt == null) {
					setTimeout(function () {
						transactionReceiptAsync(txnHash, resolve, reject);
					}, interval);
				} else {
					resolve(receipt);
				}
			} catch (e) {
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
		
		var sendAmount = 20;
		var half = 10;
		var otherHalf = 10;
		var bobStartingBalance = 0;
		var carolStartingBalance = 0;
		var contractStartingBalance = 0;

		it("should verify that the split will send half to bob and half to carol.", function () {
			var instance = Splitter.deployed();
			return Promise.all([
				// Set initial balances
				web3.eth.getBalance(instance.address),
				web3.eth.getBalance(accounts[1]),
				web3.eth.getBalance(accounts[2]),
				instance.getPendingFundsAmount(accounts[1]),
				instance.getPendingFundsAmount(accounts[2])
			]).then(function (results) {
				// Set initial pending amounts and perform the split
				contractStartingBalance = results[0].toNumber();
				bobStartingBalance = results[1].toNumber();
				carolStartingBalance = results[2].toNumber();
				assert.equal(results[0].toNumber(), 0, "splitter is starting with 0 wei");
				assert.equal(results[3].toNumber(), 0, "bob is starting with 0 pending wei available for withdrawal");
				assert.equal(results[4].toNumber(), 0, "carol is starting with 0 pending wei available for withdrawal");
				return instance.split({ from: accounts[0], value: sendAmount, gas: 3000000 })
			}).then(function (txn) {
				// Let it mine
				return web3.eth.getTransactionReceiptMined(txn);
			}).then(function (_result) {
				// Validate it was mined and re-get the balances/amount pending withdrawal
				assert.isBelow(_result.gasUsed, 3000000, "Transaction successfully mined");
				return Promise.all([
					web3.eth.getBalance(instance.address),
					instance.getPendingFundsAmount(accounts[1]),
					instance.getPendingFundsAmount(accounts[2])
				]);
			}).then(function (results) {
				// Verify that the pending amounts reflect what was expected.  Initiate the withdrawals
				assert.equal(results[0].toNumber(), sendAmount, "splitter is holding the full amount");
				assert.equal(results[1].toNumber(), half, "bob has half pending");
				assert.equal(results[2].toNumber(), otherHalf, "carol has the otherhalf pending");
				return Promise.all([
					instance.withdrawPendingFunds({ from: accounts[1] }),
					instance.withdrawPendingFunds({ from: accounts[2] }),
					web3.eth.getBalance(accounts[1]),
					web3.eth.getBalance(accounts[2])
				]);
			}).then(function (results) {
				// After withdrawals, make sure the wei showed up in Bob/Carol's accounts (from the contract address).
				assert.equal(results[2].toNumber(), (bobStartingBalance + half), "bob received his half");
				assert.equal(results[3].toNumber(), (carolStartingBalance + otherHalf), "carol received her otherHalf");
				return Promise.all([
					web3.eth.getBalance(instance.address),
					instance.getPendingFundsAmount(accounts[1]),
					instance.getPendingFundsAmount(accounts[2])
				]);
			}).then(function (results) { 
				// Make sure Bob/Carol don't have any pending funds left to transfer.
				//assert.equal(results[0].toNumber(), contractStartingBalance, "splitter has what it started with");
				assert.equal(results[1].toNumber(), 0, "bob has 0 pending funds available for withdrawal");
				assert.equal(results[2].toNumber(), 0, "carol has 0 pending funds available for withdrawal");
			}).catch(function (e) { 
				console.log("There was an error: " + e);
			})
		});
	});
});
