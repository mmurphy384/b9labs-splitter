pragma solidity ^0.4.8;

contract Splitter {
    
    address owner;
    bool isActive;
    mapping (uint => address) accounts;

    event onTransfer(address sender, address receiver, uint value, uint timeStamp); 
    event onSplit(address sender, uint weiTotal, uint weiToAddr1, uint weiToAddr2, uint timestamp);

    modifier isOwner () {
        if (msg.sender != owner) {
            throw;
        }
        _;
    }

    modifier hasFunds () {
        if (msg.sender.balance > msg.value) {
            throw;
        }
        _;
    }

    function getBalance (uint _index) constant returns (uint) {
        return accounts[_index].balance;
    }

    function Splitter (address _address1, address _address2)  {
        owner = msg.sender;
        isActive = true;
        accounts[0] = owner;
        accounts[1] = _address1;
        accounts[2] = _address2;
    }

    function split() isOwner() payable  {
        
        if (!isActive) throw;

        var half = msg.value / 2;
        var otherhalf = msg.value - half; 

        if (!accounts[1].send(half)) throw;
        onTransfer(msg.sender,accounts[1],half, now);
        if (!accounts[2].send(otherhalf)) throw;
        onTransfer(msg.sender,accounts[2],otherhalf, now);
        onSplit(msg.sender, msg.value, half, otherhalf, now);
    }

    function killMe() isOwner() returns (bool) {
        isActive = false;
        return true;
    }

    function () payable {

    }
}