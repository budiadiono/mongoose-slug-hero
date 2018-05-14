'use strict'

/**
 * Mocha hooks to always clear & drop db for each test
 * Thanks to: http://www.scotchmedia.com/tutorials/express/authentication/1/06
 **/

var mongoose = require('mongoose'),
  db = require('./config')

module.exports = function() {
  before('Clear database', function(done) {
    function clearDB() {
      var collections = mongoose.connection.collections
      for (var i in collections) {
        if (collections[i]) {
          collections[i].remove(function() {})
        }
      }
      setTimeout(function() {
        return done()
      }, 500)
    }

    if (mongoose.connection.readyState === 0) {
      mongoose.connect(db, function(err) {
        if (err) {
          throw err
        }
        return clearDB()
      })
    } else {
      return clearDB()
    }
  })

  after('Drop database', function(done) {
    setTimeout(function() {
      mongoose.connection.db.dropDatabase(function(err) {
        if (err) {
          return done(err)
        }
        mongoose.disconnect(done)
      })
    }, 500)
  })
}
