[![Build Status](https://travis-ci.org/codius/codius-host.svg?branch=master)](https://travis-ci.org/codius/codius-host)
# Codius host

**NOT READY FOR PRODUCTION USE**

This is a prototype implementation of a Codius host. Codius hosts run applications and provide them with APIs that allow for key generation, interaction with outside systems and lots more! Please keep in mind that is an early prototype and it's still missing a lot of functionality for it to be secure, stable and useful.

## Prerequisites

To use the Codius host, you need a recent version of Linux.

### Linux

For the example commands below, we assume you're on Ubuntu 14.04 or later. But most up-to-date Linux distributions should work. We definitely recommend being on the latest stable release though.

If you're on Windows/Mac try installing [Vagrant](https://docs.vagrantup.com/v2/installation/index.html) and then run:

```sh
vagrant init ubuntu/trusty32
vagrant up
vagrant ssh
```

Congratulations, you are running Ubuntu/Linux! Proceed.

### 32-bit libc/libstdc++ (Skip if you're using Vagrant or a 32-bit installation)

On 64-bit systems you need to have the 32-bit versions of libc, libstdc++ and libseccomp installed.

On Ubuntu, run:

``` sh
sudo dpkg --add-architecture i386
sudo apt-get update
sudo apt-get install libc6-i386 lib32stdc++6 libseccomp2:i386
```

### git

Install git by running:

``` sh
sudo apt-get install git
```

### Node.js

Next, you need a recent version of Node.js. All versions of 0.10.x or higher should work.

On Ubuntu, you can install Node.js simply by:

```sh
sudo add-apt-repository ppa:chris-lea/node.js
sudo apt-get update
sudo apt-get install nodejs
sudo ln -s /usr/bin/nodejs /usr/local/bin/node
```

## Installation

``` sh
sudo npm install -g codius-host
```

## Getting started

To interact with your Codius host, check out the [Codius CLI](https://www.npmjs.com/package/codius).

### Setting up a local Codius host for testing

#### Certificate

First, you need to generate a self-signed certificate. Run the following OpenSSL command to generate RSA keys and note where your server.key and server.crt are located:

``` sh
openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout server.key -out server.crt
```

#### Local hostname

In order to use a local Codius host, you need to redirect requests like https://abcabc-abcabc-abcabc.example.com to your local host. Unfortunately, `/etc/hosts` does not allow you to specify wildcard hosts.

On Ubuntu, an easy way to get around this problem is using `dnsmasq`.

``` sh
sudo apt-get install dnsmasq
echo 'address=/localcodius/127.0.0.1' | sudo tee --append /etc/dnsmasq.conf
sudo /etc/init.d/dnsmasq restart
```

Afterwards, configure your Codius host to use "localcodius" as its hostname. You'll be able to access local applications using URLs like https://abcabc-abcabc-abcabc.localcodius:2633.

#### Run

``` sh
SSL_CERT=/path/to/server.crt SSL_KEY=/path/to/server.key codius-host start
```

### Configuration options

#### Starting balance

By default, an application is considered **pending** when uploaded to your Codius host until its balance is credited. However, you can choose to give applications a free starting balance by modifying `starting_cpu_balance` in `/lib/config.js` or running with:

``` sh
starting_cpu_balance=100 codius-host start
```

#### Billing

Codius host can be run with Bitcoin (alongside bitcoind) and/or Ripple billing enabled like so:

``` sh
BITCOIND_HOST=your_bitcoind BITCOIND_PORT=bitcoind_port BITCOIND_USER=Your_Username BITCOIND_PASS=Your_Password codius-host start -f bitcoin_billing
```

``` sh
RIPPLE_ADDRESS=rYOURRIPPLEADDRESS codius-host start -f ripple_billing
```

See `/lib/config.js` to modify values such as `cpu_per_bitcoin`.

## Contributing

Development of features should be made on the `master` branch behind a Feature Flag. To create a feaure flag require `lib/features.js` and only run your feature's code if the feature is enabled. Feature names are in ALL_CAPS.

````
var features = require('lib/features')

if (features.isEnabled('MY_COOL_FEATURE')) {
  // New code belongs here
}
````

Features are enabled at startup using the command line flag -f or --features. Multiple features can be specified using commas without spaces.

````
codius-host start --features my_cool_feature

codius-host start -f feature_one,feature_two
````
