'use strict'

var db = require('../test-helper/config')

/**
 * Slug generation test for existing model
 **/

var _ = require('lodash'),
  mongoose = require('mongoose'),
  hooks = require('../test-helper/drop-create-hooks'),
  should = require('should'),
  slugHero = require('../lib/mongoose-slug-hero')

describe('Ensure slug is exists', function() {
  hooks()

  it('should be able to generate slug on existing model', function(done) {
    var fields = {
      name: String
    }

    // Define existing schema and model
    var oldSchema = new mongoose.Schema(fields)
    var ExistingModel = mongoose.model('ExistingModel', oldSchema)

    var foundId, generatedSlug

    // add some data to exsiting model
    new ExistingModel({ name: 'Sponge Bob' }).save(function(err, result) {
      if (err) {
        throw err
      }

      foundId = result.id

      // close current session
      delete mongoose.connection.models.ExistingModel

      mongoose.disconnect(function() {
        // open new session
        mongoose.connect(db, function() {
          // change schema
          var newSchema = new mongoose.Schema(fields)
          newSchema.plugin(slugHero, {
            doc: 'simple1',
            field: 'name',
            counter: 'my_slug_counters',
            slugFieldName: 'mySlug',
            slugsFieldName: 'mySlugs',
            slugOptions: {
              lower: false,
              replacement: '_'
            }
          })
          var NewModel = mongoose.model('ExistingModel', newSchema)
          NewModel.ensureSlugIsExists(function(err, slug) {
            if (err) {
              throw err
            }

            // slug should be generated correctly
            NewModel.findById(foundId, function(err, result) {
              // The counter should be written in 'my_slug_counters'
              mongoose.connection.db.collection('my_slug_counters', function(
                err,
                collection
              ) {
                collection.find({}).toArray(function(err, res) {
                  res[0]._id.should.equal('simple1|name*Sponge Bob*')

                  // Now find it
                  NewModel.findBySlug('Sponge_Bob').exec(function(err, result) {
                    should.exist(result.mySlugs)
                    should.exist(result.mySlug)
                    result.mySlug.should.equal('Sponge_Bob')
                    foundId.should.equal(result.id)
                    done()
                  })
                })
              })
            })
          })
        })
      })
    })
  })
})
