var Web3 = require("web3");
var SolidityEvent = require("web3/lib/web3/event.js");

(function() {
  // Planned for future features, logging, etc.
  function Provider(provider) {
    this.provider = provider;
  }

  Provider.prototype.send = function() {
    this.provider.send.apply(this.provider, arguments);
  };

  Provider.prototype.sendAsync = function() {
    this.provider.sendAsync.apply(this.provider, arguments);
  };

  var BigNumber = (new Web3()).toBigNumber(0).constructor;

  var Utils = {
    is_object: function(val) {
      return typeof val == "object" && !Array.isArray(val);
    },
    is_big_number: function(val) {
      if (typeof val != "object") return false;

      // Instanceof won't work because we have multiple versions of Web3.
      try {
        new BigNumber(val);
        return true;
      } catch (e) {
        return false;
      }
    },
    merge: function() {
      var merged = {};
      var args = Array.prototype.slice.call(arguments);

      for (var i = 0; i < args.length; i++) {
        var object = args[i];
        var keys = Object.keys(object);
        for (var j = 0; j < keys.length; j++) {
          var key = keys[j];
          var value = object[key];
          merged[key] = value;
        }
      }

      return merged;
    },
    promisifyFunction: function(fn, C) {
      var self = this;
      return function() {
        var instance = this;

        var args = Array.prototype.slice.call(arguments);
        var tx_params = {};
        var last_arg = args[args.length - 1];

        // It's only tx_params if it's an object and not a BigNumber.
        if (Utils.is_object(last_arg) && !Utils.is_big_number(last_arg)) {
          tx_params = args.pop();
        }

        tx_params = Utils.merge(C.class_defaults, tx_params);

        return new Promise(function(accept, reject) {
          var callback = function(error, result) {
            if (error != null) {
              reject(error);
            } else {
              accept(result);
            }
          };
          args.push(tx_params, callback);
          fn.apply(instance.contract, args);
        });
      };
    },
    synchronizeFunction: function(fn, instance, C) {
      var self = this;
      return function() {
        var args = Array.prototype.slice.call(arguments);
        var tx_params = {};
        var last_arg = args[args.length - 1];

        // It's only tx_params if it's an object and not a BigNumber.
        if (Utils.is_object(last_arg) && !Utils.is_big_number(last_arg)) {
          tx_params = args.pop();
        }

        tx_params = Utils.merge(C.class_defaults, tx_params);

        return new Promise(function(accept, reject) {

          var decodeLogs = function(logs) {
            return logs.map(function(log) {
              var logABI = C.events[log.topics[0]];

              if (logABI == null) {
                return null;
              }

              var decoder = new SolidityEvent(null, logABI, instance.address);
              return decoder.decode(log);
            }).filter(function(log) {
              return log != null;
            });
          };

          var callback = function(error, tx) {
            if (error != null) {
              reject(error);
              return;
            }

            var timeout = C.synchronization_timeout || 240000;
            var start = new Date().getTime();

            var make_attempt = function() {
              C.web3.eth.getTransactionReceipt(tx, function(err, receipt) {
                if (err) return reject(err);

                if (receipt != null) {
                  // If they've opted into next gen, return more information.
                  if (C.next_gen == true) {
                    return accept({
                      tx: tx,
                      receipt: receipt,
                      logs: decodeLogs(receipt.logs)
                    });
                  } else {
                    return accept(tx);
                  }
                }

                if (timeout > 0 && new Date().getTime() - start > timeout) {
                  return reject(new Error("Transaction " + tx + " wasn't processed in " + (timeout / 1000) + " seconds!"));
                }

                setTimeout(make_attempt, 1000);
              });
            };

            make_attempt();
          };

          args.push(tx_params, callback);
          fn.apply(self, args);
        });
      };
    }
  };

  function instantiate(instance, contract) {
    instance.contract = contract;
    var constructor = instance.constructor;

    // Provision our functions.
    for (var i = 0; i < instance.abi.length; i++) {
      var item = instance.abi[i];
      if (item.type == "function") {
        if (item.constant == true) {
          instance[item.name] = Utils.promisifyFunction(contract[item.name], constructor);
        } else {
          instance[item.name] = Utils.synchronizeFunction(contract[item.name], instance, constructor);
        }

        instance[item.name].call = Utils.promisifyFunction(contract[item.name].call, constructor);
        instance[item.name].sendTransaction = Utils.promisifyFunction(contract[item.name].sendTransaction, constructor);
        instance[item.name].request = contract[item.name].request;
        instance[item.name].estimateGas = Utils.promisifyFunction(contract[item.name].estimateGas, constructor);
      }

      if (item.type == "event") {
        instance[item.name] = contract[item.name];
      }
    }

    instance.allEvents = contract.allEvents;
    instance.address = contract.address;
    instance.transactionHash = contract.transactionHash;
  };

  // Use inheritance to create a clone of this contract,
  // and copy over contract's static functions.
  function mutate(fn) {
    var temp = function Clone() { return fn.apply(this, arguments); };

    Object.keys(fn).forEach(function(key) {
      temp[key] = fn[key];
    });

    temp.prototype = Object.create(fn.prototype);
    bootstrap(temp);
    return temp;
  };

  function bootstrap(fn) {
    fn.web3 = new Web3();
    fn.class_defaults  = fn.prototype.defaults || {};

    // Set the network iniitally to make default data available and re-use code.
    // Then remove the saved network id so the network will be auto-detected on first use.
    fn.setNetwork("default");
    fn.network_id = null;
    return fn;
  };

  // Accepts a contract object created with web3.eth.contract.
  // Optionally, if called without `new`, accepts a network_id and will
  // create a new version of the contract abstraction with that network_id set.
  function Contract() {
    if (this instanceof Contract) {
      instantiate(this, arguments[0]);
    } else {
      var C = mutate(Contract);
      var network_id = arguments.length > 0 ? arguments[0] : "default";
      C.setNetwork(network_id);
      return C;
    }
  };

  Contract.currentProvider = null;

  Contract.setProvider = function(provider) {
    var wrapped = new Provider(provider);
    this.web3.setProvider(wrapped);
    this.currentProvider = provider;
  };

  Contract.new = function() {
    if (this.currentProvider == null) {
      throw new Error("Splitter error: Please call setProvider() first before calling new().");
    }

    var args = Array.prototype.slice.call(arguments);

    if (!this.unlinked_binary) {
      throw new Error("Splitter error: contract binary not set. Can't deploy new instance.");
    }

    var regex = /__[^_]+_+/g;
    var unlinked_libraries = this.binary.match(regex);

    if (unlinked_libraries != null) {
      unlinked_libraries = unlinked_libraries.map(function(name) {
        // Remove underscores
        return name.replace(/_/g, "");
      }).sort().filter(function(name, index, arr) {
        // Remove duplicates
        if (index + 1 >= arr.length) {
          return true;
        }

        return name != arr[index + 1];
      }).join(", ");

      throw new Error("Splitter contains unresolved libraries. You must deploy and link the following libraries before you can deploy a new version of Splitter: " + unlinked_libraries);
    }

    var self = this;

    return new Promise(function(accept, reject) {
      var contract_class = self.web3.eth.contract(self.abi);
      var tx_params = {};
      var last_arg = args[args.length - 1];

      // It's only tx_params if it's an object and not a BigNumber.
      if (Utils.is_object(last_arg) && !Utils.is_big_number(last_arg)) {
        tx_params = args.pop();
      }

      tx_params = Utils.merge(self.class_defaults, tx_params);

      if (tx_params.data == null) {
        tx_params.data = self.binary;
      }

      // web3 0.9.0 and above calls new twice this callback twice.
      // Why, I have no idea...
      var intermediary = function(err, web3_instance) {
        if (err != null) {
          reject(err);
          return;
        }

        if (err == null && web3_instance != null && web3_instance.address != null) {
          accept(new self(web3_instance));
        }
      };

      args.push(tx_params, intermediary);
      contract_class.new.apply(contract_class, args);
    });
  };

  Contract.at = function(address) {
    if (address == null || typeof address != "string" || address.length != 42) {
      throw new Error("Invalid address passed to Splitter.at(): " + address);
    }

    var contract_class = this.web3.eth.contract(this.abi);
    var contract = contract_class.at(address);

    return new this(contract);
  };

  Contract.deployed = function() {
    if (!this.address) {
      throw new Error("Cannot find deployed address: Splitter not deployed or address not set.");
    }

    return this.at(this.address);
  };

  Contract.defaults = function(class_defaults) {
    if (this.class_defaults == null) {
      this.class_defaults = {};
    }

    if (class_defaults == null) {
      class_defaults = {};
    }

    var self = this;
    Object.keys(class_defaults).forEach(function(key) {
      var value = class_defaults[key];
      self.class_defaults[key] = value;
    });

    return this.class_defaults;
  };

  Contract.extend = function() {
    var args = Array.prototype.slice.call(arguments);

    for (var i = 0; i < arguments.length; i++) {
      var object = arguments[i];
      var keys = Object.keys(object);
      for (var j = 0; j < keys.length; j++) {
        var key = keys[j];
        var value = object[key];
        this.prototype[key] = value;
      }
    }
  };

  Contract.all_networks = {
  "default": {
    "abi": [
      {
        "constant": false,
        "inputs": [],
        "name": "resurrectMe",
        "outputs": [
          {
            "name": "",
            "type": "bool"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "withdrawPendingFunds",
        "outputs": [],
        "payable": true,
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "killMe",
        "outputs": [
          {
            "name": "",
            "type": "bool"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "_address",
            "type": "address"
          }
        ],
        "name": "getPendingFundsAmount",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "split",
        "outputs": [
          {
            "name": "",
            "type": "string"
          }
        ],
        "payable": true,
        "type": "function"
      },
      {
        "inputs": [
          {
            "name": "_address0",
            "type": "address"
          },
          {
            "name": "_address1",
            "type": "address"
          },
          {
            "name": "_address2",
            "type": "address"
          }
        ],
        "payable": false,
        "type": "constructor"
      },
      {
        "payable": true,
        "type": "fallback"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "name": "sender",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "weiTotal",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "weiToAddress1",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "weiToAddress2",
            "type": "uint256"
          },
          {
            "indexed": true,
            "name": "Addr1",
            "type": "address"
          },
          {
            "indexed": true,
            "name": "Addr2",
            "type": "address"
          }
        ],
        "name": "onSplit",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "isProcessed",
            "type": "bool"
          },
          {
            "indexed": true,
            "name": "weiToWhom",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "weiTotal",
            "type": "uint256"
          }
        ],
        "name": "onWithdrawPendingFunds",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "fromWhom",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "weiTotal",
            "type": "uint256"
          }
        ],
        "name": "OnFallbackReceipt",
        "type": "event"
      }
    ],
    "unlinked_binary": "0x6060604052346100005760405160608061064c8339810160409081528151602083015191909201515b60008054600160a060020a03808616600160a060020a031960a060020a60ff021990931674010000000000000000000000000000000000000000178316178084557fa6eef7e35abe7026729641147f7915573c7e97b47efa546f5f6e3230263bcb49805484169183169190911790557fcc69885fda6bcc1a4ace058b4a62bf5e179ea78fd58a1ccd71c22cc9b688792f805486831690841681179091557fd9d16d34ffb15ba3a3d852f0d403e2ce1d691fb54de27ac87cd2f993f3ec330f8054928616929093168217909255908252600260205260408083208390559082528120555b5050505b61052e8061011e6000396000f300606060405236156100515763ffffffff60e060020a600035041663050d631381146100a75780630a7636ac146100c8578063b603cd80146100d2578063f1d0ed25146100f3578063f76541761461011e575b6100a55b60003411156100a25760408051600160a060020a033316815234602082015281517f39d1569f1d1e846d090c1524d9415565ef53c90542c98a778db4c731df56e7da929181900390910190a15b5b565b005b34610000576100b46101a6565b604080519115158252519081900360200190f35b6100a56101ee565b005b34610000576100b46102bf565b604080519115158252519081900360200190f35b346100005761010c600160a060020a0360043516610301565b60408051918252519081900360200190f35b610126610320565b60408051602080825283518183015283519192839290830191850190808383821561016c575b80518252602083111561016c57601f19909201916020918201910161014c565b505050905090810190601f1680156101985780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b6000805433600160a060020a039081169116146101c257610000565b506000805474ff0000000000000000000000000000000000000000191660a060020a17905560015b5b90565b33600160a060020a03811660009081526002602052604081205490919082908181111561027257600160a060020a0383166000818152600260205260408082208290555183156108fc0291849190818181858888f19350505050156102565760019350610272565b600160a060020a03831660009081526002602052604090208190555b5b604080518515158152602081018390528151600160a060020a038616927fbe0e916d347e44dda6df0702c29f7588215390c59fa97c0c6a6e5a649cab0d98928290030190a25b50505050565b6000805433600160a060020a039081169116146102db57610000565b506000805474ff00000000000000000000000000000000000000001916905560015b5b90565b600160a060020a0381166000908152600260205260409020545b919050565b604080516020810190915260008082528054819033600160a060020a0390811691161461034c57610000565b3433600160a060020a03163110156103995760408051808201909152600a81527f4c6f7742616c616e636500000000000000000000000000000000000000000000602082015292506104fc565b60005460a060020a900460ff1615156103e75760408051808201909152600881527f496e616374697665000000000000000000000000000000000000000000000000602082015292506104fc565b50507fcc69885fda6bcc1a4ace058b4a62bf5e179ea78fd58a1ccd71c22cc9b688792f8054600160a060020a0390811660009081526002602081815260408084208054349485049081019091557fd9d16d34ffb15ba3a3d852f0d403e2ce1d691fb54de27ac87cd2f993f3ec330f8054871686528286208054838703908101909155600180865291549190965296548251948552928401819052838201859052905190959394938416939182169233909216917f9a4077979b1320e10de05d6de494c281b164e023c7bf20311bb5f5e792499a1b919081900360600190a460408051808201909152600281527f6f6b000000000000000000000000000000000000000000000000000000000000602082015292505b5b5050905600a165627a7a72305820b6dfb977bfc0079455f237aeeb699dc397ac68ef3bf0494e8521de82abb078af0029",
    "events": {
      "0x719e07d6e03b88920bc0dde696425d7a6276b6a218d46acd15abeb96205a094a": {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "sender",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "value",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "address1",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "address2",
            "type": "address"
          }
        ],
        "name": "logSplit",
        "type": "event"
      },
      "0x74f83f1a4396186fd81d75d3d4425f3cacb05b825ef9132e24352623681c5205": {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "sender",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "receiver",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "value",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "timeStamp",
            "type": "uint256"
          }
        ],
        "name": "logTransfers",
        "type": "event"
      },
      "0x4163d0094cf4eeb06277d6472b188d08ca21ffa6b72b767452cf6b470ed768c1": {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "addr1",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "addr2",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "amount1",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "amount2",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "timeStamp",
            "type": "uint256"
          }
        ],
        "name": "logSplit",
        "type": "event"
      },
      "0x91c7d71a3ae3fb7cf61e00517bf4868e9e23d0bace5e304cbc3b68de5d85350e": {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "sender",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "receiver",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "value",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "timeStamp",
            "type": "uint256"
          }
        ],
        "name": "onTransfer",
        "type": "event"
      },
      "0xb7a9df5e5cf227aa5636b1d7846444ce7ffea6e0e145e6523ecc14ef9d9b663e": {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "sender",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "weiTotal",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "weiToAddr1",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "weiToAddr2",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "timestamp",
            "type": "uint256"
          }
        ],
        "name": "onSplit",
        "type": "event"
      },
      "0x9a4077979b1320e10de05d6de494c281b164e023c7bf20311bb5f5e792499a1b": {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "name": "sender",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "weiTotal",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "weiToAddress1",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "weiToAddress2",
            "type": "uint256"
          },
          {
            "indexed": true,
            "name": "Addr1",
            "type": "address"
          },
          {
            "indexed": true,
            "name": "Addr2",
            "type": "address"
          }
        ],
        "name": "onSplit",
        "type": "event"
      },
      "0xef6b270428dc9c5099dde1066d60c1cd85217ba6c53259e965f100c5cc7b748c": {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "name": "weiToWhom",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "weiTotal",
            "type": "uint256"
          }
        ],
        "name": "onWithdrawPendingFunds",
        "type": "event"
      },
      "0xbe0e916d347e44dda6df0702c29f7588215390c59fa97c0c6a6e5a649cab0d98": {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "isProcessed",
            "type": "bool"
          },
          {
            "indexed": true,
            "name": "weiToWhom",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "weiTotal",
            "type": "uint256"
          }
        ],
        "name": "onWithdrawPendingFunds",
        "type": "event"
      },
      "0x39d1569f1d1e846d090c1524d9415565ef53c90542c98a778db4c731df56e7da": {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "fromWhom",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "weiTotal",
            "type": "uint256"
          }
        ],
        "name": "OnFallbackReceipt",
        "type": "event"
      }
    },
    "updated_at": 1489984091751,
    "links": {},
    "address": "0x1cb56696bedf300e867b82d8c9188a7e38f2170f"
  }
};

  Contract.checkNetwork = function(callback) {
    var self = this;

    if (this.network_id != null) {
      return callback();
    }

    this.web3.version.network(function(err, result) {
      if (err) return callback(err);

      var network_id = result.toString();

      // If we have the main network,
      if (network_id == "1") {
        var possible_ids = ["1", "live", "default"];

        for (var i = 0; i < possible_ids.length; i++) {
          var id = possible_ids[i];
          if (Contract.all_networks[id] != null) {
            network_id = id;
            break;
          }
        }
      }

      if (self.all_networks[network_id] == null) {
        return callback(new Error(self.name + " error: Can't find artifacts for network id '" + network_id + "'"));
      }

      self.setNetwork(network_id);
      callback();
    })
  };

  Contract.setNetwork = function(network_id) {
    var network = this.all_networks[network_id] || {};

    this.abi             = this.prototype.abi             = network.abi;
    this.unlinked_binary = this.prototype.unlinked_binary = network.unlinked_binary;
    this.address         = this.prototype.address         = network.address;
    this.updated_at      = this.prototype.updated_at      = network.updated_at;
    this.links           = this.prototype.links           = network.links || {};
    this.events          = this.prototype.events          = network.events || {};

    this.network_id = network_id;
  };

  Contract.networks = function() {
    return Object.keys(this.all_networks);
  };

  Contract.link = function(name, address) {
    if (typeof name == "function") {
      var contract = name;

      if (contract.address == null) {
        throw new Error("Cannot link contract without an address.");
      }

      Contract.link(contract.contract_name, contract.address);

      // Merge events so this contract knows about library's events
      Object.keys(contract.events).forEach(function(topic) {
        Contract.events[topic] = contract.events[topic];
      });

      return;
    }

    if (typeof name == "object") {
      var obj = name;
      Object.keys(obj).forEach(function(name) {
        var a = obj[name];
        Contract.link(name, a);
      });
      return;
    }

    Contract.links[name] = address;
  };

  Contract.contract_name   = Contract.prototype.contract_name   = "Splitter";
  Contract.generated_with  = Contract.prototype.generated_with  = "3.2.0";

  // Allow people to opt-in to breaking changes now.
  Contract.next_gen = false;

  var properties = {
    binary: function() {
      var binary = Contract.unlinked_binary;

      Object.keys(Contract.links).forEach(function(library_name) {
        var library_address = Contract.links[library_name];
        var regex = new RegExp("__" + library_name + "_*", "g");

        binary = binary.replace(regex, library_address.replace("0x", ""));
      });

      return binary;
    }
  };

  Object.keys(properties).forEach(function(key) {
    var getter = properties[key];

    var definition = {};
    definition.enumerable = true;
    definition.configurable = false;
    definition.get = getter;

    Object.defineProperty(Contract, key, definition);
    Object.defineProperty(Contract.prototype, key, definition);
  });

  bootstrap(Contract);

  if (typeof module != "undefined" && typeof module.exports != "undefined") {
    module.exports = Contract;
  } else {
    // There will only be one version of this contract in the browser,
    // and we can use that.
    window.Splitter = Contract;
  }
})();
