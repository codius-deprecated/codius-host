
module.exports = function(codius) {
  var billing = new codius.BillingService();
  var Token   = codius.Token;

  return {
    show: function(req, res, next) {

      new Token({ token: req.params.token }).fetch()
        .then(function(token) {
          if (token) {
            billing.getBalance(token).then(function(balance) {
	      res.status(200).send({ 
                success: true,
                balance: balance.get('balance')
              })
            })
          } else {
            next(new Error('token not found'))
          }
        })
    }
  }
}

