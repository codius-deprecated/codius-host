//------------------------------------------------------------------------------
/*
    This file is part of Codius: https://github.com/codius
    Copyright (c) 2014 Ripple Labs Inc.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose  with  or without fee is hereby granted, provided that the above
    copyright notice and this permission notice appear in all copies.

    THE  SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
    WITH  REGARD  TO  THIS  SOFTWARE  INCLUDING  ALL  IMPLIED  WARRANTIES  OF
    MERCHANTABILITY  AND  FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
    ANY  SPECIAL ,  DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
    WHATSOEVER  RESULTING  FROM  LOSS  OF USE, DATA OR PROFITS, WHETHER IN AN
    ACTION  OF  CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
    OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
*/
//==============================================================================

var path = require('path');
var nconf = require('nconf');

// First consider commandline arguments and environment variables, respectively.
nconf.argv().env();

// Then load configuration from a designated file.
nconf.file({ file: 'config.json' });

// Provide default values for settings not provided above.
nconf.defaults({
  "log_format": "dev",
  "engine": {
    "disableNacl": true
  },
  "ssl": {
    "cert": path.resolve(__dirname, '../server.crt'),
    "key": path.resolve(__dirname, '../server.key')
  },
  "compute_units_per_bitcoin": 100000000
});

if (nconf.get('NODE_ENV') === 'fig') {
  // nconf doesn't support multiple layers of defaults
  // https://github.com/flatiron/nconf/issues/81
  nconf.add('db_defaults', {'type': 'literal',
    // Port for incoming TLS (e.g. HTTPS) connections
    "port":         process.env.PORT || 2633,
    "db": {
      "client": 'pg',
      "connection": {
        "host":     process.env.CODIUSHOST_DB_1_PORT_5432_TCP_ADDR,
        "port":     process.env.CODIUSHOST_DB_1_PORT_5432_TCP_PORT,
        "database": 'docker',
        "user":     'docker',
        "password": 'docker'
      },
      "pool": {
        "min": 2,
        "max": 10
      }
    }
  });
} else if (nconf.get('NODE_ENV') === 'beanstalk') {
  // nconf doesn't support multiple layers of defaults
  // https://github.com/flatiron/nconf/issues/81
  nconf.add('db_defaults', {'type': 'literal',
    "port":         process.env.CODIUS_PORT || process.env.PORT || 443,
    "db": {
      "client": "pg",
      "connection": {
        "host":     process.env.RDS_HOSTNAME,
        "port":     process.env.RDS_PORT,
        "database": process.env.RDS_DB_NAME,
        "user":     process.env.RDS_USERNAME,
        "password": process.env.RDS_PASSWORD
      },
      "pool": {
        "min": 2,
        "max": 10
      }
    },
    "ssl": {
      "ca": path.resolve(__dirname, '../ca.crt'),
      "cert": path.resolve(__dirname, '../server.crt'),
      "key": path.resolve(__dirname, '../server.key')
    },
    "bitcoin_bip32_extended_public_key": process.env.BITCOIN_EXTENDED_PUBLIC_KEY
  });
} else {
  nconf.add('db_defaults', {'type': 'literal',
    // Port for incoming TLS (e.g. HTTPS) connections
    'port': 2633,
    'db': {
      client: 'sqlite3',
      connection: {
        filename: './dev.sqlite3'
      }
    }
  });
}

module.exports = nconf;
