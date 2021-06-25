(function (exports, node) {
  var saved_instance;

  /**
   * Connect to the server and initialize the jiff instance
   */
  exports.connect = function (hostname, computation_id, options) {
    var opt = Object.assign({}, options);

    if (node) {
      // eslint-disable-next-line no-undef
      jiff = require('../../lib/jiff-client');
      // eslint-disable-next-line no-undef
      jiff_relational = require('../../lib/ext/jiff-client-relational');
      // eslint-disable-next-line no-undef,no-global-assign
      $ = require('jquery-deferred');
    }

    // eslint-disable-next-line no-undef
    saved_instance = jiff.make_jiff(hostname, computation_id, opt);
    // eslint-disable-next-line no-undef
    saved_instance.apply_extension(jiff_relational, opt);
    return saved_instance;
  };

  /**
   * Testing relational functions
   */
  function test_map(input, jiff_instance, fun) {
    var deferred = $.Deferred();
    var allPromisedResults = [];

    var arr = input['arr'];
    jiff_instance.share_array(arr, arr.length).then( function (shares) {
      // pairwise addition
      var sums = shares[1];
      var i;
      for (i=0; i<sums.length; i++) {
        for (var p=2; p<=jiff_instance.party_count; p++) {
          sums[i] = sums[i].sadd( shares[p][i] );
        }
      }
      // apply map to first array
      var result = jiff_instance.helpers.map(sums, fun);

      // process array of outputs
      for (i = 0; i<result.length; i++) {
        allPromisedResults.push(jiff_instance.open(result[i]));
      }

      Promise.all(allPromisedResults).then(function (results) {
        deferred.resolve(results);
      });
    });
    return deferred.promise();

  }

  exports.test_map_eq = function (arr, jiff_instance) {
    var eq_f = function (s) {
      return s.eq(s);
    };
    return test_map(arr, jiff_instance, eq_f);
  }

  exports.test_map_square = function (arr, jiff_instance) {
    var square_f = function (s) {
      return s.smult(s);
    };
    return test_map(arr, jiff_instance, square_f);
  }

  function test_filter(inputs, jiff_instance, fun) {
    var deferred = $.Deferred();
    var allPromisedResults = [];

    var arr = inputs['arr'];
    var cnil = inputs['nil'];
    jiff_instance.share_array(arr, arr.length).then( function (shares) {
      var sums = shares[1];
      var i;
      // pairwise addition
      for (i=0; i<sums.length; i++) {
        for (var p=2; p<=jiff_instance.party_count; p++) {
          sums[i] = sums[i].sadd( shares[p][i] );
        }
      }
      // apply filter
      var nil = jiff_instance.protocols.generate_and_share_zero().cadd(cnil);
      var result = jiff_instance.helpers.filter(sums, fun, nil);

      // process array of outputs
      for (i = 0; i<result.length; i++) {
        allPromisedResults.push(jiff_instance.open(result[i]));
      }

      Promise.all(allPromisedResults).then(function (results) {
        deferred.resolve(results);
      });
    });
    return deferred.promise();
  }

  exports.test_filter_none = function (arr, jiff_instance) {
    var true_f = function (s) {
      return s.eq(s);
    };
    return test_filter(arr, jiff_instance, true_f);
  }

  exports.test_filter_all = function (arr, jiff_instance) {
    var false_f = function (s) {
      return s.neq(s);
    };
    return test_filter(arr, jiff_instance, false_f);
  }

  exports.test_filter_some = function (arr, jiff_instance) {
    var big_f = function (s) {
      return s.cgt(50);
    };
    return test_filter(arr, jiff_instance, big_f);
  }

  function test_reduce(inputs, fun, jiff_instance) {
    var deferred = $.Deferred();
    var allPromisedResults = [];

    var arr_promise = jiff_instance.share_array(inputs['arr'], inputs['arr'].length);
    var z_promise = null;
    if (inputs['z'].length !== undefined) {
      z_promise = jiff_instance.share_array(inputs['z'],inputs['z'].length);
    } else {
      z_promise = jiff_instance.share(inputs['z']);
    }

    Promise.all([arr_promise, z_promise]).then( function (shares) {
      var arrays = shares[0];

      var z = shares[1][1]; // just use party 1's z
      // todo assert all zs are the same

      // pairwise addition
      var sums = arrays[1];
      var i;

      for (i=0; i<sums.length; i++) {
        for (var p=2; p<=jiff_instance.party_count; p++) {
          sums[i] = sums[i].sadd( arrays[p][i] );
        }
      }
      // reduce summed array
      var result = jiff_instance.helpers.reduce(sums, fun, z);

      // process array of outputs
      if (result.length) {
        for (i = 0; i<result.length; i++) {
          allPromisedResults.push(jiff_instance.open(result[i]));
        }
      } else {
        allPromisedResults.push(jiff_instance.open(result));
      }

      Promise.all(allPromisedResults).then(function (results) {
        deferred.resolve(results);
      });
    });
    return deferred.promise();
  }

  exports.test_reduce_mult = function (inputs, jiff_instance) {
    var prod_f = function (e, z) {
      return e.smult(z);
    };
    return test_reduce(inputs, prod_f, jiff_instance);
  }

  exports.test_reduce_addition = function (inputs, jiff_instance) {
    var sum_f = function (e, z) {
      return e.sadd(z);
    };
    return test_reduce(inputs, sum_f, jiff_instance);
  }

  exports.test_reduce_append = function (inputs, jiff_instance) {
    var app_f = function (x, xs) {
      xs.push(x);
      return xs;
    };
    return test_reduce(inputs, app_f, jiff_instance);
  }

  function test_countif(inputs, fun, jiff_instance) {
    var deferred = $.Deferred();

    jiff_instance.share_array(inputs['arr'], inputs['arr'].length).then( function (shares) {
      // pairwise addition
      var sums = shares[1];

      for (var p=2; p<=jiff_instance.party_count; p++) {
        for (var i=0; i<sums.length; i++) {
          sums[i] = sums[i].sadd( shares[p][i] );
        }
      }

      var count = jiff_instance.helpers.countif(sums, fun);

      jiff_instance.open(count).then(function (result) {
        deferred.resolve(result);
      });

    });

    return deferred.promise();
  }

  exports.test_count_all = function (inputs, jiff_instance) {
    var true_f = function (s) {
      return s.eq(s);
    };
    return test_countif(inputs, true_f, jiff_instance);
  }

  exports.test_count_none = function (inputs, jiff_instance) {
    var false_f = function (s) {
      return s.neq(s);
    };
    return test_countif(inputs, false_f, jiff_instance);
  }

  exports.test_count_some = function (inputs, jiff_instance) {
    var some_f = function (s) {
      return s.cgt(50);
    };
    return test_countif(inputs, some_f, jiff_instance);
  }



}((typeof exports === 'undefined' ? this.mpc = {} : exports), typeof exports !== 'undefined'));
