#Mike Murphy's Splitter Contract.

At this point, the contract is getting to a decent proto-type state

##Latest Revision:  
2/21/2017 - 03:08 GMT - Applied Xaviers recommendations in the tests and contract code.
2/28/2017 - 03:44 GMT - Created a working UI.  Split works.  Balances refresh.

##To Do List:

1. Get the constructor to set Bob and Carol's addresses to account[1] and account[2] 
  * DONE!
2. Create a test to instantiate the contract and set it up for use.
  * DONE!
3. Get the split() so that it can dynamically figure out who to send the ether to.
  * DONE!
4. Create a test to exercise the split. 
  * DONE!  
5. Create the UI / Web Pages
  * DONE! (well.  It could use a little bullet-proofing, but it works)
6. Create a watcher/listener to show logs
  * Started
6. More things to consider:
  * Review the fallback function.  Right now, it's only payable.
  * Still need to study re-entrance.

