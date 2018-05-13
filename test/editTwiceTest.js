'use strict'

var _ = require('lodash'),
  hooks = require('../test-helper/drop-create-hooks'),
  should = require('should'),
  async = require('async'),
  models = require('../test-helper/models'),
  SimpleModel = models.Simple,
  ScopedModel = models.Scoped,
  AdvancedScopedModel = models.AdvancedScoped

describe('Twice Edit Test', function() {
  hooks()

  it('#should not update slug when slug is not edited on simple model', function(done) {
    var id

    async.series(
      [
        // Add
        function(next) {
          new SimpleModel({
            name: 'Sponge Bob',
            foo: 'Gary'
          }).save(function(err, doc) {
            doc.slug.should.equal('sponge-bob')
            doc.slugs.length.should.equal(0)
            doc.foo.should.equal('Gary')
            id = doc.id
            next(err)
          })
        },

        // Edit foo
        function(next) {
          SimpleModel.findById(id, function(err, model) {
            model.foo = 'Patrick'
            model.save(function(err, doc) {
              doc.slug.should.equal('sponge-bob')
              doc.slugs.length.should.equal(0)
              doc.foo.should.equal('Patrick')
              next(err)
            })
          })
        },

        // Edit foo again...
        function(next) {
          SimpleModel.findById(id, function(err, model) {
            model.foo = 'Lary'
            model.save(function(err, doc) {
              doc.slug.should.equal('sponge-bob')
              doc.slugs.length.should.equal(0)
              doc.foo.should.equal('Lary')
              next(err)
            })
          })
        },

        // Edit name!!!
        function(next) {
          SimpleModel.findById(id, function(err, model) {
            model.name = 'Squidward'
            model.save(function(err, doc) {
              doc.slug.should.equal('squidward')
              doc.slugs.length.should.equal(1)
              doc.foo.should.equal('Lary')
              next(err)
            })
          })
        }
      ],
      done
    )
  })

  it('#should not update slug when slug is not edited on scoped model', function(done) {
    var id

    async.series(
      [
        // Add
        function(next) {
          new ScopedModel({
            name: 'Sponge Bob',
            owner: 'Me',
            foo: 'Gary'
          }).save(function(err, doc) {
            doc.slug.should.equal('sponge-bob')
            doc.slugs.length.should.equal(0)
            doc.foo.should.equal('Gary')
            id = doc.id
            next(err)
          })
        },

        // Edit foo
        function(next) {
          ScopedModel.findById(id, function(err, model) {
            model.foo = 'Patrick'
            model.save(function(err, doc) {
              doc.slug.should.equal('sponge-bob')
              doc.slugs.length.should.equal(0)
              doc.foo.should.equal('Patrick')
              next(err)
            })
          })
        },

        // Edit foo again...
        function(next) {
          ScopedModel.findById(id, function(err, model) {
            model.foo = 'Lary'
            model.save(function(err, doc) {
              doc.slug.should.equal('sponge-bob')
              doc.slugs.length.should.equal(0)
              doc.foo.should.equal('Lary')
              next(err)
            })
          })
        },

        // Edit name!!!
        function(next) {
          ScopedModel.findById(id, function(err, model) {
            model.name = 'Squidward'
            model.save(function(err, doc) {
              doc.slug.should.equal('squidward')
              doc.slugs.length.should.equal(1)
              doc.foo.should.equal('Lary')
              next(err)
            })
          })
        }
      ],
      done
    )
  })

  it('#should not update slug when slug is not edited on advanced scoped model', function(done) {
    var id, ownerId

    async.series(
      [
        // Create Owner
        function(next) {
          new SimpleModel({
            name: 'Mr. Krabs'
          }).save(function(err, doc) {
            doc.slug.should.equal('mr-krabs')
            ownerId = doc.id
            next(err)
          })
        },

        // Add
        function(next) {
          new AdvancedScopedModel({
            name: 'Sponge Bob',
            owner: ownerId,
            foo: 'Gary'
          }).save(function(err, doc) {
            doc.slug.should.equal('sponge-bob')
            doc.slugs.length.should.equal(0)
            doc.foo.should.equal('Gary')
            id = doc.id
            next(err)
          })
        },

        // Edit foo
        function(next) {
          AdvancedScopedModel.findById(id, function(err, model) {
            model.foo = 'Patrick'
            model.save(function(err, doc) {
              doc.slug.should.equal('sponge-bob')
              doc.slugs.length.should.equal(0)
              doc.foo.should.equal('Patrick')
              next(err)
            })
          })
        },

        // Edit foo again...
        function(next) {
          AdvancedScopedModel.findById(id, function(err, model) {
            model.foo = 'Lary'
            model.save(function(err, doc) {
              doc.slug.should.equal('sponge-bob')
              doc.slugs.length.should.equal(0)
              doc.foo.should.equal('Lary')
              next(err)
            })
          })
        },

        // Create Other Owner
        function(next) {
          new SimpleModel({
            name: 'Mrs. Puff'
          }).save(function(err, doc) {
            doc.slug.should.equal('mrs-puff')
            ownerId = doc.id
            next(err)
          })
        },

        // Edit owner!!!
        function(next) {
          AdvancedScopedModel.findById(id, function(err, model) {
            model.owner = ownerId
            model.save(function(err, doc) {
              doc.slug.should.equal('sponge-bob')
              doc.slugs.length.should.equal(1)
              doc.foo.should.equal('Lary')
              next(err)
            })
          })
        }
      ],
      done
    )
  })
})
