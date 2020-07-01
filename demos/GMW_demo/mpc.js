const GMW=require('./gmw_share.js');
const GMW_OPEN=require('./gmw_open.js');
const GMW_OT=require('./gmw_OT.js');
const GMW_xor=require('./gmw_xor.js');

(function (exports, node) {
  var saved_instance;
  var seeds = {};
  // Unique prefix seed for op_ids
  /**
   * Connect to the server and initialize the jiff instance
   */
  exports.connect = function (hostname, computation_id, options) {
    var opt = Object.assign({}, options);
    opt.crypto_provider = true;

    if (node) {
      // eslint-disable-next-line no-undef
      JIFFClient = require('../../lib/jiff-client');
      $ = require('jquery-deferred');
    }

    // eslint-disable-next-line no-undef
    saved_instance = new JIFFClient(hostname, computation_id, opt);
    return saved_instance;
  };

  exports.compute = function (input,jiff_instance) {
    if (jiff_instance == null) {
      jiff_instance = saved_instance;

    }
    // xor bwteen which  two parties.
    //var sendls=[2,3];
    var shares;
    shares=GMW.gmw_jiff_share(jiff_instance,input);
    // get ci promise
    //var ci=GMW_xor.gmw_xor(jiff_instance, shares[2],shares[3]);
    var ci=GMW_OT.gmw_and(jiff_instance,shares[2],shares[3]);
    // open the ci among all party including broadcast and reconstruct phase
    return GMW_OPEN.gmw_jiff_open(jiff_instance,ci);
  }

}((typeof exports === 'undefined' ? this.mpc = {} : exports), typeof exports !== 'undefined'));

/* !!open test use
    var allPromises=[];
    for (var k = 1; k <=Object.keys(shares).length; k++) {
      allPromises.push(GMW_OPEN.gmw_jiff_open(jiff_instance,shares[k]));
    }
    return Promise.all(allPromises);
    //eg.[1,0]
    */
