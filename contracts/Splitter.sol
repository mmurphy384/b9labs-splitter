pragma solidity ^0.4.5;

contract Splitter {
    address owner;
    address public bob;
    address public carol;

    function Splitter() {
        owner = 0x05c07dc6f56edd1a4416bafa1dd0828f44d17b6b;
        bob = 0xaa838939b36918cd8def05f1e5d9dcc54e67f983;
        carol = 0xc48368f9b45be3ca50bf54258780c85763033792;   
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