'use strict'

/**
 * Mocha hooks to always clear & drop db for each test
 * Thanks to: http://www.scotchmedia.com/tutorials/express/authentication/1/06
 **/

var mongoose = require('mongoose'),
  db = 'mongodb://127.0.0.1/slugherodbtest'

module.exports = function () {
  before('Clear database', function (done) {
    function clearDB () {
      for (var i in mongoose.connection.collections) {
        mongoose.connection.collections[i].remove(function () {})
      }
      setTimeout(function () {
        return done()
      }, 500)
    }

    if (mongoose.connection.readyState === 0) {
      mongoose.connect(db, function (err) {
        if (err) {
          throw err
        }
        return clearDB()
      })
    } else {
      return clearDB()
    }

  })

  after('Drop database', function (done) {
    setTimeout(function () {
      mongoose.connection.db.dropDatabase(function (err) {
        if (err) return done(err)
        mongoose.disconnect(done)
      })

    }, 500)
  })

}
