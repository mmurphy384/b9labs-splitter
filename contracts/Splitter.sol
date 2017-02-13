pragma solidity ^0.4.5;

contract Splitter {
    address owner;
    address public bob;
    address public carol;

    function Splitter (address addr1, address addr2) {
        owner = msg.sender;
        bob = addr1;
        carol = addr2;   
    }

    function split(address toWhom1, address toWhom2) payable {
        var half = msg.value / 2;
        var otherhalf = msg.value - half; 
        if (!toWhom1.send(half)) throw;
        if (!toWhom2.send(otherhalf)) throw;
    }

    function killMe() returns (bool) {
        if (msg.sender == owner) {
            suicide(owner);
            return true;
        }
    }

    function () payable {}
}