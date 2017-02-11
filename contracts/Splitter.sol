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

    function split(address addr1, address addr2, uint sendAmount) returns (bool) {
        owner = msg.sender;
        bob = addr1;
        carol = addr2;         
        bool bobResult = addr1.send(sendAmount/2);
        bool carolResult = addr2.send(sendAmount/2);
        return bobResult && carolResult;
    }

    function killMe() returns (bool) {
        if (msg.sender == owner) {
            suicide(owner);
            return true;
        }
    }

    function () payable {}
}