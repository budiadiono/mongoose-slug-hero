'use strict'

/**
 * Slug generation test for model that has more than 1 field as a scope
 **/

var _ = require('lodash'),
  hooks = require('../test-helper/drop-create-hooks'),
  should = require('should'),
  ScopedModel = require('../test-helper/models').Scoped

describe('Find by slug test', function () {
  hooks()

  var data = []

  describe('#find by slug bound to owner', function () {
    it('should generate correct slugs', function (done) {
      var model = { name: 'SpongeBob', owner: 'Squidward' }

      // First 
      new ScopedModel(model).save(function (err, doc1) {
        doc1.slug.should.equal('spongebob')
        data.push({
          owner: 'Squidward',
          id: doc1._id
        })

        // Second, same owner
        new ScopedModel(model).save(function (err, doc2) {
          doc2.slug.should.equal('spongebob-2')
          data.push({
            owner: 'Squidward',
            id: doc2._id
          })

          // Third, different owner
          model.owner = 'Patrick'
          new ScopedModel(model).save(function (err, doc3) {
            doc3.slug.should.equal('spongebob')
            data.push({
              owner: 'Patrick',
              id: doc3._id
            })

            // Fourth, same previous owner
            new ScopedModel(model).save(function (err, doc4) {
              doc4.slug.should.equal('spongebob-2')
              data.push({
                owner: 'Patrick',
                id: doc4._id
              })
              done()
            }) // Fourth

          }) // Third

        }) // Second

      }) // First

    })

    it('should find correct data #1', function (done) {
      ScopedModel.findBySlug({slug:'spongebob', owner:'Squidward'}, function (err, res) {
        res._id.should.eql(data[0].id);
        done()
      })
    })
	
	it('should find correct data #2', function (done) {
      ScopedModel.findBySlug({slug:'spongebob-2', owner:'Squidward'}, function (err, res) {
        res._id.should.eql(data[1].id);
        done()
      })
    })
	
	it('should find correct data #3', function (done) {
      ScopedModel.findBySlug({slug:'spongebob', owner:'Patrick'}, function (err, res) {
        res._id.should.eql(data[2].id);
        done()
      })
    })
	
	it('should find correct data #4', function (done) {
      ScopedModel.findBySlug({slug:'spongebob-2', owner:'Patrick'}, function (err, res) {
        res._id.should.eql(data[3].id);
        done()
      })
    })

  })

})
