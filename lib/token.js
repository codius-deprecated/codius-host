var random = require('random-js')();

var TOKEN_REGEX = exports.TOKEN_REGEX = /^[a-z0-9]{6}-[a-z0-9]{6}-[a-z0-9]{6}$/i;

var TOKEN_SEGMENT_MIN = exports.TOKEN_SEGMENT_MIN = parseInt('100000', 36);
var TOKEN_SEGMENT_MAX = exports.TOKEN_SEGMENT_MAX = parseInt('zzzzzz', 36);

/**
 * Generate a segment for a Codius token.
 *
 * It's a random base36 string of length 6.
 */
var generateSegment = exports.generateSegment = function () {
  return random.integer(TOKEN_SEGMENT_MIN, TOKEN_SEGMENT_MAX).toString(36);
};

/**
 * Generate a random Codius token.
 *
 * A Codius token is a token of the form [a-z0-9]{6}-[a-z0-9]{6}-[a-z0-9]{6}.
 */
exports.generateToken = function () {
  return generateSegment() + '-' + generateSegment() + '-' + generateSegment();
};
