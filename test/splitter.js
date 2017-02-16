contract('Splitter', function() {
  it("should make sure we can access Bob's address.", function() {
    var split = Splitter.deployed();

    return split.bob.call()
      .then(function (_result) {
        assert.equal(1, 1, "Bob's address is " + _result);
      })
      .done();
  });
});

