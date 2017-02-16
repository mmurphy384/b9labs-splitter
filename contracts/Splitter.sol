pragma solidity ^0.4.5;


contract Splitter {
    address owner;
    uint counter;
    uint public maxAccounts;
    mapping (uint => address) accounts;

    function Splitter () {
        owner = msg.sender;
        counter = 0;
        maxAccounts = 2;
    }

    function addMyAccount() {
        // Only allow 2 accounts
        if (counter > (maxAccounts-1)) throw;

        accounts[counter] = msg.sender;
        counter +=1;
    }

    function getNumAccounts() constant returns (uint) {
        return counter;
    }

    function getAccount(uint _index) constant returns (address) {
        return accounts[_index];
    }

    function getMyBalance() constant returns (uint) {
        return msg.sender.balance;
    }

    function split() payable {
        var half = msg.value / 2;
        var otherhalf = msg.value - half; 
        for (var i=0; i<(maxAccounts-1);i++) {
            if (!accounts[i].send(half)) throw;
            if (!accounts[i].send(otherhalf)) throw;
        }
    }

    function killMe() returns (bool) {
        if (msg.sender == owner) {
            suicide(owner);
            return true;
        }
    }

    function () payable {}
}