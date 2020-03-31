/**
 * Do not modify this file unless you have to.
 * This file has UI handlers.
 */

/* global config */

// eslint-disable-next-line no-unused-vars
function connect() {
  $('#connectButton').prop('disabled', true);
  var computation_id = $('#computation_id').val();

  var options = { party_count: config.party_count, Zp: 13 };
  options.onError = function (_, error) {
    $('#output').append("<p class='error'>"+error+'</p>');
  };

  var hostname = window.location.hostname.trim();
  var port = window.location.port;
  if (port == null || port === '') {
    port = '80';
  }
  if (!(hostname.startsWith('http://') || hostname.startsWith('https://'))) {
    hostname = 'http://' + hostname;
  }
  if (hostname.endsWith('/')) {
    hostname = hostname.substring(0, hostname.length-1);
  }
  if (hostname.indexOf(':') > -1 && hostname.lastIndexOf(':') > hostname.indexOf(':')) {
    hostname = hostname.substring(0, hostname.lastIndexOf(':'));
  }

  hostname = hostname + ':' + port;
  // eslint-disable-next-line no-undef
  var jiff = mpc.connect(hostname, computation_id, options, config);
  jiff.wait_for(config.compute_parties, function () {
    $('#processButton').attr('disabled', false); $('#output').append('<p>Connected to the compute parties!</p>');
  });
}

// eslint-disable-next-line no-unused-vars
function submit() {
  var arr = JSON.parse(document.getElementById('inputText').value);

  for (var i = 0; i < arr.length; i++) {
    if (typeof(arr[i]) !== 'number') {
      alert('Please input an array of integers.');
      return;
    }
  }

  $('#processButton').attr('disabled', true);
  $('#output').append('<p>Starting...</p>');

  // eslint-disable-next-line no-undef
  var promise = mpc.compute(arr);
  promise.then(handleResult);
}

function handleResult(result) {
  $('#output').append('<p>Result is: ' + result + '</p>');
  $('#button').attr('disabled', false);
}
