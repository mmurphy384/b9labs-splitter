pragma solidity ^0.4.8;

contract Splitter {
    
    address owner;
    bool isActive;
    mapping (uint => address) accounts;

    event onSplit(address indexed sender, uint weiTotal, uint weiToAddress1, uint weiToAddress2, address indexed Addr1, address indexed Addr2);

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

    function Splitter (address _address1, address _address2)  {
        owner = msg.sender;
        isActive = true;
        accounts[0] = owner;
        accounts[1] = _address1;
        accounts[2] = _address2;
    }

    function split() isOwner payable  {
        
        if (!isActive) throw;

        uint half = msg.value / 2;
        uint otherhalf = msg.value - half; 

        if (!accounts[1].send(half)) throw;
        if (!accounts[2].send(otherhalf)) throw;

        onSplit(msg.sender, msg.value, half, otherhalf, accounts[1], accounts[2]);
    }

    function killMe() isOwner returns (bool) {
        isActive = false;
        return true;
    }

    function () isOwner payable {

    }
}