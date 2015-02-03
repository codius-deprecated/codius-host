var Promise = require('bluebird')

module.exports = function(codius) {

  var billing = new codius.BillingService();

  function getToken(token) {
    return new codius.Token({ token: token }).fetch()
      .then(function(token) {
        if (token) {
          return Promise.resolve(token)
        } else {
          return Promise.reject(new Error('token not found'))
        }
      })
  }

  return {
    create: function(req, res, next) {
      getToken(req.params.token).then(function(token) {
        billing.credit(token, req.body.amount)
          .then(function(credit) {
            return token.getBalance().then(function(balance) {
              res.send({
                success: true,
                balance: balance.get('balance'),
                credit: credit
              })
            })
          })
      }) 
      .error(next)
    },

    index: function(req, res, next) {
      getToken(req.params.token).then(function(token) {
        return billing.getCredits(token).then(function(credits) {
          res.status(200).send({
            success: true,
            credits: credits
          })
        })
      }) 
      .error(next)
    }
  }
}

