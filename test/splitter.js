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

		it("should verify that the split will send half to bob and half to carol.", function () {
			var instance = Splitter.deployed();
			return Promise.all([
				web3.eth.getBalance(accounts[0]),
				web3.eth.getBalance(accounts[1]),
				web3.eth.getBalance(accounts[2])
			]).then(function (results) { 
				bobStartingBalance = results[1];
				carolStartingBalance = results[2];
				return instance.split({ from: accounts[0], value: sendAmount, gas: 3000000 })
			}).then(function (txn) {
				return web3.eth.getTransactionReceiptMined(txn);
			}).then(function (_result) {
				assert.isBelow(_result.gasUsed, 3000000, "Transaction successfully mined");
				return Promise.all([
					web3.eth.getBalance(accounts[0]),
					web3.eth.getBalance(accounts[1]),
					web3.eth.getBalance(accounts[2])
				]);
			}).then(function (results) {
				var expected1 = (bobStartingBalance + half);
				var expected2 = (carolStartingBalance + otherHalf);
				assert.equal(results[1].toNumber(), expected1, "bob received half");
				assert.equal(results[2].toNumber(), expected2, "carol received half");
				}).catch(function (e) { 
					console.log("There was an error: " + e);
				})
		});
	});
});
