pragma solidity ^0.4.8;

contract Splitter {
    
    address owner;
    bool isActive;
    mapping (uint => address) accounts;
    mapping (address => uint) pendingTransfers;
    
    event onSplit(address indexed sender, uint weiTotal, uint weiToAddress1, uint weiToAddress2, address indexed Addr1, address indexed Addr2);
    event onWithdrawPendingFunds(bool isProcessed, address indexed weiToWhom, uint weiTotal);
    event OnFallbackReceipt(address fromWhom, uint weiTotal); 

    // ------ Private and Internal Functions ---------------------------------

    modifier isOwner() {
        if (msg.sender != owner) {
            throw;
        }
        _;
     }

    // Contstructor - Not Payable
    function Splitter (address _address0, address _address1, address _address2)  {
        isActive = true;
        owner = _address0;
        accounts[0] = owner;
        accounts[1] = _address1;
        accounts[2] = _address2;
        pendingTransfers[_address1] = 0;
        pendingTransfers[_address2] = 0;
    }

    // Private Function to earmark funds for later withdrawal
    function addPendingFunds(address _address, uint amount) private  {
        pendingTransfers[_address] += amount;
    }

    // ------ Public Functions -----------------------------------------------

    // Function to retrieve the current balance that can be withdrawn
    function getPendingFundsAmount(address _address) constant returns (uint) {
        return pendingTransfers[_address];
    }
    
    // Function to withdraw funds to the designated account
    function withdrawPendingFunds() payable  {
        var success = false;
        address _account = msg.sender;
        var amount = 0;
        var withdrawalAmount = pendingTransfers[_account];
        if (withdrawalAmount > 0) {
            // clear the amount (re-entrance protection)
            pendingTransfers[_account] = 0; 
            if (_account.send(withdrawalAmount)) 
                success = true;
            else 
                pendingTransfers[_account] = withdrawalAmount; 
        }
        onWithdrawPendingFunds(success,_account, withdrawalAmount);
    }

    // Function to split from from account[0]. Half to account[1], half to account[2]
    function split() isOwner payable returns (string) { 
        // do some simple error checking
        if (msg.sender.balance < msg.value) 
            return 'LowBalance';
        if (!isActive)
            return 'Inactive';

        uint half = msg.value / 2;
        uint otherhalf = msg.value - half; 
        
        // Update the amounts available to the recipients
        pendingTransfers[accounts[1]] += half;
        pendingTransfers[accounts[2]] += otherhalf;
        
        onSplit(msg.sender, msg.value, half, otherhalf, accounts[1], accounts[2]);
        return 'ok';
    }
    
    // Function to disable the contract permanently
    function resurrectMe() isOwner returns (bool) {
        isActive = true;
        return true;
    }

    // Function to disable the contract permanently
    function killMe() isOwner returns (bool) {
        isActive = false;
        return true;
    }

    function () payable {
        if (msg.value > 0) OnFallbackReceipt(msg.sender, msg.value);
    }
}