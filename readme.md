#Mike Murphy's Splitter Contract.

At this point, the contract is getting to a decent proto-type state

##Latest Revision:  
2/21/2017 - 3:08 GMT - Applied Xaviers recommendations in the tests and contract code.


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
  * IN PROGRESS - Preliminary UI working.  Need to add a watcher/listener so the balances refresh.
6. More things to consider:
  * Set up logs so that a web UI can read them (Having problems with this)
  * Review the fallback function.  Right now, it's only payable.
  * Still need to study re-entrance.

