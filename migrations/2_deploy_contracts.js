module.exports = function(deployer) {
  deployer.deploy(ConvertLib);
  deployer.autolink();
  deployer.deploy(Splitter,web3.eth.accounts[0],web3.eth.accounts[1], web3.eth.accounts[2]);
};
