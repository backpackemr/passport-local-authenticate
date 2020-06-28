var crypto = require('crypto');
var scmp = require('scmp');

var ArgumentError = require('generaterr')('ArgumentError');

module.exports = {
  hash :hash,
  verify : verify
};

function hash(password, options, next) {
  if (typeof options == 'function') {
    next = options;
    options = null;
  }

  options = defaultOptions(options);

  if (!password) {
    return next(new ArgumentError('Password argument is not specified'));
  }

  crypto.randomBytes(options.saltlen, function(err, buf) {
    if (err) { return next(err); }

    var salt = buf.toString(options.encoding);

    crypto.pbkdf2(password, salt, options.iterations, options.keylen, options.digestAlgorithm, function(err, hashRaw) {
      if (err) { return next(err); }

      var hash = new Buffer(hashRaw, 'binary').toString(options.encoding);

      next(null, { salt : salt, hash : hash });
    });
  });
}

function verify(password, credentials, options, next) {
  if (typeof options == 'function') {
    next = options;
    options = null;
  }

  options = defaultOptions(options);

  if (!password) {
    return next(new ArgumentError('password argument is not specified'));
  }

  if (!credentials) {
    return next(new ArgumentError('Credentials argument is not specified'));
  }

  if (!credentials.salt) {
    return next(new ArgumentError('Salt argument is not specified'));
  }

  if (!credentials.hash) {
    return next(new ArgumentError('Salt argument is not specified'));
  }

  crypto.pbkdf2(password, credentials.salt, options.iterations, options.keylen, options.digestAlgorithm, function (err, hashRaw) {
    if (err) { return next(err); }

    var hash = new Buffer(hashRaw, 'binary').toString(options.encoding);

    return next(null, scmp(hash, credentials.hash));
  });
}

function defaultOptions(options) {
  options = options || {};
  options.saltlen = options.saltlen || 32;
  options.encoding = options.encoding || 'hex';
  options.iterations = options.iterations || 64000;
  options.keylen = options.keylen || 512;
  options.digestAlgorithm = options.digestAlgorithm || 'SHA512';

  return options;
}
