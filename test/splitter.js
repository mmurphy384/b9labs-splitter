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
		var sendAmount = 20;
		var half = (sendAmount / 2);
		var otherHalf = (sendAmount - half);
		var aliceAddress = web3.eth.accounts[0];
		var bobAddress = web3.eth.accounts[1];
		var carolAddress = web3.eth.accounts[2];
		var bobStartingBalance = 0;
		var carolStartingBalance = 0;

		beforeEach("Deploy contract and get instance.", function () {
			instance = Splitter.deployed();
			return instance.getBalance.call('bob')
			.then(function (_result) {
				bobStartingBalance = _result.toNumber();
				return instance.getBalance.call('carol');
			}).then(function (_result) {
				carolStartingBalance = _result.toNumber();
			});
		});

		it("should verify that the split will send half to bob and half to carol.", function () {
			var split = Splitter.at(instance.address);
			return split.getAddress.call("alice")
				.then(function (_result) {
					assert.equal(aliceAddress, _result, "alices address is correct");
					return split.getAddress.call("bob");
				}).then(function (_result) {
					assert.equal(bobAddress, _result, "bobs address is correct");
					return split.getAddress.call("carol");
				}).then(function (_result) {
					assert.equal(carolAddress, _result, "carols address is correct");
					return split.split({from:web3.eth.accounts[0]});
				}).then(function (txn) {
					return web3.eth.getTransactionReceiptMined(txn);
				}).then(function (_result) {
					assert.equal(1, 1, "Transaction successfully mined");
					return split.getBalance.call('bob');
				}).then(function (_result) { 
					var expected = (bobStartingBalance + half);
					assert.equal(expected, _result.toNumber(), "bob received half");
					return split.getBalance.call('carol');
				}).then(function (_result) { 
					var expected = (carolStartingBalance + otherHalf);
					assert.equal(expected, _result.toNumber(), "carol received half");
				})
		});
	});
});


