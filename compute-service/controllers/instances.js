var Promise = require('bluebird')

module.exports = function(codius) {

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
      getToken(req.body.token).then(function(token) {
        return codius.compute.startInstance(token,
                                            req.body.container_uri,
                                            req.body.type, 
                                            req.body.vars,
                                            req.body.port)
          .then(function(instance) {
            res.send({
              success: true,
              instance: instance
            })
          })
      })
      .error(next)
    },

    stop: function(req, res, next) {
      getToken(req.params.token).then(function(token) {
        return codius.compute.stopInstance(token)
          .then(function(state) {
            res.send({
              success: true,
              instance: {
                state: state
              }
            })
          })
      })
      .error(next)
    },

    index: function(req, res, next) {
      return codius.compute.getInstances().then(function(instances) {
        res.status(200).send({
          success: true,
          instances: instances
        })
      })
      .error(next)
    },

    show: function(req, res, next) {
      getToken(req.params.token).then(function(token) {
        return codius.compute.getInstance(token)
          .then(function(instance) {
            res.status(200).send({
              success: true,
              instance: instance
            })
          })
      })
      .error(next)
    }
  }
}

