pragma solidity ^0.4.5;

contract Splitter {
    address owner;
    address public bob;
    address public carol;

    function Splitter() payable {
        owner = msg.sender;
        bob = 0xb61a1675eebb38a1fe16c2d724c0a0ac47529cf9;
        carol = 0xf532f8124d43e986955dc93b4ef979da535b98ed;        
    }

    function split(uint sendAmount) returns (bool) {
        bool bobResult = bob.send(1000000000000000000);
        bool carolResult = carol.send(1000000000000000000);
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