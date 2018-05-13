'use strict'

/**
 * Slug generation test for model that has more than 1 field as a scope
 **/

var _ = require('lodash'),
  mongoose = require('mongoose'),
  hooks = require('../test-helper/drop-create-hooks'),
  should = require('should'),
  slugHero = require('../lib/mongoose-slug-hero')

describe('Customize options', function() {
  hooks()

  describe('Type A', function() {
    it('should be able to use custom options', function(done) {
      var customSchema = new mongoose.Schema({
        name: String
      })

      customSchema.plugin(slugHero, {
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
      var CustomModel = mongoose.model('CustomizedModel1', customSchema)

      var foundId
      new CustomModel({ name: 'Sponge Bob' }).save(function(err, result) {
        if (err) {
          throw err
        }

        foundId = result.id

        // Slug should be generated in 'mySlug'
        result.mySlug.should.equal('Sponge_Bob')
        // There should be mySlugs
        should.exist(result.mySlugs)

        // Defaults should be gone
        should.not.exist(result.slug)
        should.not.exist(result.slugs)

        // The counter should be written in 'my_slug_counters'
        mongoose.connection.db.collection('my_slug_counters', function(
          err,
          collection
        ) {
          collection.find({}).toArray(function(err, res) {
            res[0]._id.should.equal('simple1|name*Sponge Bob*')

            // Now find it
            CustomModel.findBySlug('Sponge_Bob').exec(function(err, result) {
              foundId.should.equal(result.id)

              done()
            })
          })
        })
      })
    })
  })

  describe('Type B', function() {
    it('should be able to use custom options', function(done) {
      var customSchema = new mongoose.Schema({
        name: String
      })

      customSchema.plugin(slugHero, {
        doc: 'simple2',
        field: 'name',
        counter: 'my_slug_counters2',
        slugField: 'mySlug',
        slugsField: 'mySlugs',
        slugOptions: {
          lower: false,
          replacement: '_'
        }
      })
      var CustomModel = mongoose.model('CustomizedModel2', customSchema)

      var foundId
      new CustomModel({ name: 'Sponge Bob' }).save(function(err, result) {
        if (err) {
          throw err
        }

        foundId = result.id

        // Slug should be generated in 'mySlug'
        result.mySlug.should.equal('Sponge_Bob')
        // There should be mySlugs
        should.exist(result.mySlugs)

        // Defaults should be gone
        should.not.exist(result.slug)
        should.not.exist(result.slugs)

        // The counter should be written in 'my_slug_counters'
        mongoose.connection.db.collection('my_slug_counters2', function(
          err,
          collection
        ) {
          collection.find({}).toArray(function(err, res) {
            res[0]._id.should.equal('simple2|name*Sponge Bob*')

            // Now find it
            CustomModel.findBySlug('Sponge_Bob').exec(function(err, result) {
              foundId.should.equal(result.id)

              done()
            })
          })
        })
      })
    })
  })
})
