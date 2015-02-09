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

module.exports.Server         = require(path.join(__dirname, 'server'));
module.exports.Application    = require(path.join(__dirname, 'application'));
module.exports.BillingService = require(path.join(__dirname, 'billing_service'));
module.exports.compute        = require(path.join(__dirname, 'compute_service'));
module.exports.Manager        = require(path.join(__dirname, 'manager')).Manager;
module.exports.Token          = require(path.join(__dirname, '/../models/token')).model;
module.exports.features       = require(path.join(__dirname, 'features'));
module.exports.config         = require(path.join(__dirname, 'config'));
module.exports.logger         = require(path.join(__dirname, 'log')).winston;

