'use strict'

/**
 * Dot notation field test
 **/

var _ = require('lodash'),
  hooks = require('../test-helper/drop-create-hooks'),
  should = require('should'),
  async = require('async'),
  DottedModel = require('../test-helper/models').DottedModel

describe('Dot notation test', function () {
  hooks()

  it('#1 - simple add', function (done) {
    new DottedModel({ name: 'SpongeBob',
      info: {
        title: 'Happy Day',
        subtitle: 'All day long with jellyfish'
      }
    }).save(function (err, doc) {
      if (err) throw err
      doc.config.slug.should.equal('happy-day')
      done()
    })
  })

  it('#2 - simple edit', function (done) {
    var id

    async.series([

      // Add
      function (next) {
        new DottedModel({ name: 'SpongeBob',
          info: {
            title: 'Scarry Day',
            subtitle: 'All day long with Mrs. Puff'
          }
        }).save(function (err, doc) {
          if (err) throw err
          doc.config.slug.should.equal('scarry-day')
          id = doc.id
          next()
        })
      },

      // Find and Edit
      function (next) {
        DottedModel.findById(id, function (err, doc) {
          doc.info.title = 'Good Day'
          doc.save(function (err1, doc1) {
            // Assert new value
            doc1.config.slug.should.equal('good-day')

            // Assert history
            doc1.config.slugs[0].should.equal('scarry-day')

            next()
          })

        })

      }

    ], done)

  })

  it('#3 - find one and update then findBySlug', function (done) {
    var id

    async.series([

      // Add
      function (next) {
        new DottedModel({ name: 'SpongeBob',
          info: {
            title: 'Great Day',
            subtitle: 'All day long with Squidward'
          }
        }).save(function (err, doc) {
          if (err) throw err
          doc.config.slug.should.equal('great-day')
          id = doc.id
          next()
        })
      },

      // Find and Edit
      function (next) {
        DottedModel.findOneAndUpdate({_id: id},
          {
            info: {
              title: 'Mad Day',
							subtitle: 'All day long with Patrick'
            }
          },
          { new: true },
          function (err, doc) {
						
            // Assert new value
            doc.config.slug.should.equal('mad-day')

            // Assert history
            doc.config.slugs[0].should.equal('great-day')

            next(err)

          })

      },
			
			// findBuSlug #1
			function (next) {
				
				DottedModel.findBySlug('great-day', function(err, doc) {
					doc.id.should.equal(id)
					next(err)
				})
				
			},
			
			// findBuSlug #2
			function (next) {
				
				DottedModel.findBySlug('mad-day', function(err, doc) {
					doc.id.should.equal(id)
					next(err)
				})
				
			}

    ], done)

  })

})
