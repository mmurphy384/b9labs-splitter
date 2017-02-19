pragma solidity ^0.4.8;

contract Splitter {
    
    address owner;
    bool isActive;
    mapping (string => address) accounts;


    event logSplit(address sender, uint value, address address1, address address2); 

    function Splitter (address _address1, address _address2) {
        owner = msg.sender;
        isActive = true;
        accounts['alice'] = owner;
        accounts['bob'] = _address1;
        accounts['carol'] = _address2;
    }

    // Provide a GETter so owner can manage addresses.
    function getAddress(string _name) constant returns (address) {
        return accounts[_name];
    }
    
    // Provider a SETter so the owner can update an address.
    function updateAddress(string _name, address _addr) returns (address) {
        if (owner != msg.sender) throw;
        accounts[_name] = _addr;
    }    

    function resurrect() returns (address) {
        if (owner != msg.sender) throw;
        isActive = true;
    }

    function getBalance(string _name) constant returns (uint) {
        return accounts[_name].balance;
    }

    function split()  payable  {
        
        if (!isActive) throw;

        var half = msg.value / 2;
        var otherhalf = msg.value - half; 

        if (!accounts['bob'].send(half)) throw;
        if (!accounts['carol'].send(otherhalf)) throw;
        logSplit(msg.sender, msg.value, accounts['bob'], accounts['carol']);
    }

    function killMe() returns (bool) {
        if (msg.sender == owner) {
            isActive = false;
            return true;
        }
    }

    function () payable {

    }
}