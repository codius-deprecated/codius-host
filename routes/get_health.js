var db = require('../lib/db');

module.exports = function (req, res, next) {
  db.knex.migrate.currentVersion().then(function (version) {
    res.status(200).send('OK');
  }).catch(next);
};
