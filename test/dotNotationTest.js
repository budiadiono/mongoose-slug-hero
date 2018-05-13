'use strict'

/**
 * Dot notation field test
 **/

var _ = require('lodash'),
  hooks = require('../test-helper/drop-create-hooks'),
  should = require('should'),
  async = require('async'),
  models = require('../test-helper/models'),
  DottedModel = models.DottedModel,
  DottedScopedModel = models.DottedScopedModel

describe('Dot notation test', function() {
  describe('Simple Dotted Model', function() {
    hooks()

    it('#1 - simple add', function(done) {
      new DottedModel({
        name: 'SpongeBob',
        info: {
          title: 'Happy Day',
          subtitle: 'All day long with jellyfish'
        }
      }).save(function(err, doc) {
        if (err) {
          throw err
        }
        doc.config.slug.should.equal('happy-day')
        done()
      })
    })

    it('#2 - simple edit', function(done) {
      var id

      async.series(
        [
          // Add
          function(next) {
            new DottedModel({
              name: 'SpongeBob',
              info: {
                title: 'Scarry Day',
                subtitle: 'All day long with Mrs. Puff'
              }
            }).save(function(err, doc) {
              if (err) {
                throw err
              }
              doc.config.slug.should.equal('scarry-day')
              id = doc.id
              next()
            })
          },

          // Find and Edit
          function(next) {
            DottedModel.findById(id, function(err, doc) {
              doc.info.title = 'Good Day'
              doc.save(function(err1, doc1) {
                // Assert new value
                doc1.config.slug.should.equal('good-day')

                // Assert history
                doc1.config.slugs[0].should.equal('scarry-day')

                next()
              })
            })
          }
        ],
        done
      )
    })

    it('#3 - find one and update then findBySlug', function(done) {
      var id

      async.series(
        [
          // Add
          function(next) {
            new DottedModel({
              name: 'SpongeBob',
              info: {
                title: 'Great Day',
                subtitle: 'All day long with Squidward'
              }
            }).save(function(err, doc) {
              if (err) {
                throw err
              }
              doc.config.slug.should.equal('great-day')
              id = doc.id
              next()
            })
          },

          // Find and Edit
          function(next) {
            DottedModel.findOneAndUpdate(
              { _id: id },
              {
                info: {
                  title: 'Mad Day',
                  subtitle: 'All day long with Patrick'
                }
              },
              { new: true },
              function(err, doc) {
                // Assert new value
                doc.config.slug.should.equal('mad-day')

                // Assert history
                doc.config.slugs[0].should.equal('great-day')

                next(err)
              }
            )
          },

          // findBuSlug #1
          function(next) {
            DottedModel.findBySlug('great-day', function(err, doc) {
              doc.id.should.equal(id)
              next(err)
            })
          },

          // findBuSlug #2
          function(next) {
            DottedModel.findBySlug('mad-day', function(err, doc) {
              doc.id.should.equal(id)
              next(err)
            })
          }
        ],
        done
      )
    })
  })

  describe('Scoped Dotted Model', function() {
    hooks()

    var id1, id2

    it('#1 - simple add', function(done) {
      async.series(
        [
          function(next) {
            new DottedScopedModel({
              name: 'SpongeBob',
              info: {
                title: 'Happy Day',
                subtitle: 'All day long with jellyfish'
              },
              group: {
                name: 'G1'
              }
            }).save(function(err, doc) {
              if (err) {
                throw err
              }
              doc.config.slug.should.equal('happy-day')
              next()
            })
          },

          function(next) {
            new DottedScopedModel({
              name: 'SpongeBob',
              info: {
                title: 'Happy Day',
                subtitle: 'All day long with jellyfish'
              },
              group: {
                name: 'G1'
              }
            }).save(function(err, doc) {
              if (err) {
                throw err
              }
              doc.config.slug.should.equal('happy-day-2')
              next()
            })
          },

          function(next) {
            new DottedScopedModel({
              name: 'SpongeBob',
              info: {
                title: 'Happy Day',
                subtitle: 'All day long with jellyfish'
              },
              group: {
                name: 'G2'
              }
            }).save(function(err, doc) {
              if (err) {
                throw err
              }
              doc.config.slug.should.equal('happy-day')
              next()
            })
          }
        ],
        done
      )
    })

    it('#2 - simple edit', function(done) {
      var id1, id2

      async.series(
        [
          // Add to scope 1
          function(next) {
            new DottedScopedModel({
              name: 'SpongeBob',
              info: {
                title: 'Scarry Day',
                subtitle: 'All day long with Mrs. Puff'
              },
              group: {
                name: 'G1'
              }
            }).save(function(err, doc) {
              if (err) {
                throw err
              }
              doc.config.slug.should.equal('scarry-day')
              id1 = doc.id
              next()
            })
          },

          // Add to scope 2
          function(next) {
            new DottedScopedModel({
              name: 'SpongeBob',
              info: {
                title: 'Scarry Day',
                subtitle: 'All day long with Mrs. Puff'
              },
              group: {
                name: 'G2'
              }
            }).save(function(err, doc) {
              if (err) {
                throw err
              }
              doc.config.slug.should.equal('scarry-day')
              id2 = doc.id
              next()
            })
          },

          // Find and Edit scope 1
          function(next) {
            DottedScopedModel.findById(id1, function(err, doc) {
              doc.info.title = 'Good Day'
              doc.save(function(err1, doc1) {
                // Assert new value
                doc1.config.slug.should.equal('good-day')

                // Assert history
                doc1.config.slugs[0].should.equal('scarry-day')

                next()
              })
            })
          },

          // Find and Edit scope 2
          function(next) {
            DottedScopedModel.findById(id2, function(err, doc) {
              doc.info.title = 'Awesome Day'
              doc.save(function(err1, doc1) {
                // Assert new value
                doc1.config.slug.should.equal('awesome-day')

                // Assert history
                doc1.config.slugs[0].should.equal('scarry-day')

                next()
              })
            })
          },

          // Change scope on data 1 from 1 to 2
          function(next) {
            DottedScopedModel.findById(id1, function(err, doc) {
              doc.info.title = 'Scarry Day'
              doc.group.name = 'G2'
              doc.save(function(err1, doc1) {
                // Assert new value
                doc1.config.slug.should.equal('scarry-day-2')

                // Assert history
                // doc1.config.slugs[0].should.equal('scarry-day')

                next()
              })
            })
          }
        ],
        done
      )
    })

    it('#3 - find one and update then findBySlug', function(done) {
      var id

      async.series(
        [
          // Add data on G1
          function(next) {
            new DottedScopedModel({
              name: 'SpongeBob',
              info: {
                title: 'Great Day',
                subtitle: 'All day long with Squidward'
              },
              group: {
                name: 'G1'
              }
            }).save(function(err, doc) {
              if (err) {
                throw err
              }
              doc.config.slug.should.equal('great-day')
              id = doc.id
              next()
            })
          },

          // Add data on G2
          function(next) {
            new DottedScopedModel({
              name: 'SpongeBob',
              info: {
                title: 'Mad Day',
                subtitle: 'All day long with Squidward'
              },
              group: {
                name: 'G2'
              }
            }).save(function(err, doc) {
              if (err) {
                throw err
              }
              doc.config.slug.should.equal('mad-day')
              next()
            })
          },

          // Find and Edit (Move first data from G1 to G2)
          function(next) {
            DottedScopedModel.findOneAndUpdate(
              { _id: id },
              {
                info: {
                  title: 'Mad Day',
                  subtitle: 'All day long with Patrick'
                },
                group: {
                  name: 'G2'
                }
              },
              { new: true },
              function(err, doc) {
                // console.log(doc)

                // Assert new value
                doc.config.slug.should.equal('mad-day-2')

                // Assert history
                doc.config.slugs[0].should.equal('great-day')

                next(err)
              }
            )
          },

          // findBuSlug #1
          function(next) {
            DottedScopedModel.findBySlug('great-day', function(err, doc) {
              doc.id.should.equal(id)
              next(err)
            })
          },

          // findBuSlug #2
          function(next) {
            DottedScopedModel.findBySlug('mad-day-2', function(err, doc) {
              doc.id.should.equal(id)
              next(err)
            })
          }
        ],
        done
      )
    })
  })
})
