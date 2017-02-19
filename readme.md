#Mike Murphy's Splitter Contract.

At this point, the contract is getting to a decent proto-type state

To Do List:

1. Get the constructor to set Bob and Carol's addresses to account[1] and account[2] 
  * PENDING
2. Create a test to add 2 accounts and confirm they were added.
  * DONE!
3. Get the split() so that it can dynamically figure out who to send the ether to.
  * DONE!
4. Create a test to exercise the split. 
  * DONE!  
5. Create a structure to hold the Transaction {amountSuccessfullySentToBob, amountSuccessfullySentToCarol} 
   so that we can maintain the status of the split.  For example, if bob.send works and carol.send doesn't.
   we might like to record what was actually sent so that we could roll it back.  THis can be built out
   to support letting all 3 parties approve the transaction.
  * JUST A THOUGHT AT THIS POINT


