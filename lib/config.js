var nconf = require('nconf');

// First consider commandline arguments and environment variables, respectively.
nconf.argv().env();

// Then load configuration from a designated file.
nconf.file({ file: 'config.json' });

// Provide default values for settings not provided above.
nconf.defaults({
  // Port for incoming TLS (e.g. HTTPS) connections
  'port': 2633,

  // Internal HTTP socket, you should not have to change this.
  'internal_http': {
    'path': './internal_http'
  },
  'log_format': 'dev',
  'engine': {

  },

  // The port that contracts can listen to to receive external connections.
  //
  // You should never change this.
  'virtual_port': 8000
});

if (nconf.get('NODE_ENV') === 'fig') {
  // nconf doesn't support multiple layers of defaults
  // https://github.com/flatiron/nconf/issues/81
  nconf.add('db_defaults', {'type': 'literal',
    'db': {
      client: 'pg',
      connection: {
        host:     process.env.CODIUSHOST_DB_1_PORT_5432_TCP_ADDR,
        port:     process.env.CODIUSHOST_DB_1_PORT_5432_TCP_PORT,
        database: 'docker',
        user:     'docker',
        password: 'docker'
      },
      pool: {
        min: 2,
        max: 10
      }
    }
  });
} else {
  nconf.add('db_defaults', {'type': 'literal',
    'db': {
      client: 'sqlite3',
      connection: {
        filename: './dev.sqlite3'
      }
    }
  });
}

module.exports = nconf;
