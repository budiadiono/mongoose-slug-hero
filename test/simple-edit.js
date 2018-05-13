'use strict'

/**
 * Slug generation when model is edited.
 * This will also covers findBySlug static method.
 **/

var _ = require('lodash'),
  hooks = require('../test-helper/drop-create-hooks'),
  should = require('should'),
  async = require('async'),
  SimpleModel = require('../test-helper/models').Simple

describe('Edit Simple Model Test', function() {
  hooks()

  var createSlugsTest = function(cb) {
    new SimpleModel({ name: 'SpongeBob' }).save(function(err, doc1) {
      if (err) {
        throw err
      }

      // Created normal slug
      doc1.slug.should.equal('spongebob')

      // Find and edit 1
      SimpleModel.findOne({ _id: doc1._id }, function(err, doc2) {
        if (err) {
          throw err
        }

        // Edit name that should update the slug
        doc2.name = 'Gary'
        doc2.save(function(err, doc3) {
          if (err) {
            throw err
          }
          doc3.slug.should.equal('gary')

          // Find and edit 2
          SimpleModel.findOne({ _id: doc3._id }, function(err, doc4) {
            if (err) {
              throw err
            }

            // Edit name using the firstly name that should update the slug
            // But it should be different slug as first created slug
            doc4.name = 'SpongeBob'
            doc4.save(function(err, doc5) {
              if (err) {
                throw err
              }
              doc5.slug.should.equal('spongebob-2')
              cb()
            })
          }) // Find and edit 2
        })
      }) // Find and edit 1
    })
  } // CreateSlug function

  var findBySlugTest = function(cb) {
    // Generated slugs from previous test
    var slugs = ['spongebob', 'gary', 'spongebob-2'],
      tasks = []

    // Define findBySlug task for each slug
    _.each(slugs, function(slug) {
      tasks.push(function(next) {
        SimpleModel.findBySlug(slug, function(err, doc) {
          if (err) {
            throw err
          }
          next(null, doc)
        })
      })
    })

    // Execute each findBySlug task
    async.parallel(tasks, function(err, results) {
      // All slugs should pointed to same data
      should.ok(
        results[0].id === results[1].id && results[0].id === results[2].id
      )
      cb()
    })
  }

  describe('#create and edit simple model', function() {
    it('should generate correct slug', function(done) {
      createSlugsTest(done)
    })
    it('findBySlug should ponited to correct data', function(done) {
      findBySlugTest(done)
    })
  })
})
