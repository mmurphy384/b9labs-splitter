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
		var half = (sendAmount / 2);
		var otherHalf = (sendAmount - half);
		var aliceAddress = accounts[0];
		var bobAddress = accounts[1];
		var carolAddress = accounts[2];
		var bobStartingBalance = 0;
		var carolStartingBalance = 0;

		it("should make sure we can retrieve bob and carols balances", function () {
			var instance = Splitter.deployed();
			return instance.getBalance.call(1)
				.then(function (_result) {
					bobStartingBalance = _result.toNumber();
					return instance.getBalance.call(2);
				}).then(function (_result) {
					carolStartingBalance = _result.toNumber();
					assert.isTrue(bobStartingBalance >= 100000000000000000000, "His balance is actually " + _result.toNumber());
					assert.isTrue(carolStartingBalance >= 100000000000000000000, "Her balance is actually " + _result.toNumber());
				});
		});

		it("should verify that the split will send half to bob and half to carol.", function () {
			var instance = Splitter.deployed();
			return instance.split({ from: accounts[0], value: sendAmount})
				.then(function (txn) {
					return web3.eth.getTransactionReceiptMined(txn);
				}).then(function (_result) {
					assert.equal(1, 1, "Transaction successfully mined");
					return instance.getBalance.call(1);
				}).then(function (_result) {
					var expected = (bobStartingBalance + half);
					assert.equal(expected, _result.toNumber(), "bob received half");
					return instance.getBalance.call(2);
				}).then(function (_result) {
					var expected = (carolStartingBalance + otherHalf);
					assert.equal(expected, _result.toNumber(), "carol received half");
				});
		});
	});
});

