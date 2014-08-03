var chalk = require('chalk');

exports.hash = function (hash) {
  return chalk.blue(hash.substr(0, 8));
};
