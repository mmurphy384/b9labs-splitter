pragma solidity ^0.4.5;

contract Splitter {
    address owner;
    uint counter;
    uint maxAccounts;
    mapping (string => address) accounts;

    event logSplit(address sender, uint value, address address1, address address2); 

    function Splitter () {
        owner = msg.sender;
        counter = 1;
        maxAccounts = 2;
    }

    function addMyAccount(string _accountName) {
        // Only allow 2 accounts. Need to count, 
        // because we can't use accounts.length.
        // alice is eth.coinbase.
        if (counter > (maxAccounts)) throw;

        accounts[_accountName] = msg.sender;
        counter +=1;
    }

    function getMaxAccounts() constant returns (uint) {
        return maxAccounts;
    }

    function getNumAccounts() constant returns (uint) {
        return counter;
    }

    function getAccount(string _name) constant returns (address) {
        return accounts[_name];
    }

    function getMyBalance(string _name) constant returns (uint) {
        return accounts[_name].balance;
    }

    function split(string _name1, string _name2) payable {
        var half = msg.value / 2;
        var otherhalf = msg.value - half; 

        // I would love to find a way to abstract the account names 
        // and quantity, but that's a project for another day.
        if (!accounts[_name1].send(half)) throw;
        if (!accounts[_name2].send(otherhalf)) throw;
        logSplit(msg.sender, msg.value, accounts[_name1], accounts[_name2]);

    }

    function killMe() returns (bool) {
        if (msg.sender == owner) {
            suicide(owner);
            return true;
        }
    }

    function () payable {

    }
}