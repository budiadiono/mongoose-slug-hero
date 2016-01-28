'use strict'

/**
 * Slug generation when model is edited.
 * This will also covers findBySlug static method.
 **/

var hooks = require('../test-helper/drop-create-hooks'),
  should = require('should'),
  async = require('async'),
  SimpleModel = require('../test-helper/models').Simple

describe('Find One And Update', function () {
  hooks()

  var slugHero = require('../lib/mongoose-slug-hero'),
    mongoose = require('mongoose'),
    Schema = mongoose.Schema

  // CATEGORY
  var categorySchema = new Schema({
    name: { type: String }
  })
  mongoose.model('Category', categorySchema)

  // ARTICLE
  var articleSchema = new Schema({
    category: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
    title: { type: String, required: true },
    intro: { type: String },
    body: { type: String},
    quote: { type: String},
    quote_citation: { type: String},
    cover: { type: String },
    updated_at: { type: Date, default: Date.now },
    published: { type: Boolean }
  })
  articleSchema.plugin(slugHero, {doc: 'article', field: 'title'})
  mongoose.model('Article', articleSchema)
	
	it('#1 - should works with findOneAndUpdate', function (done) {
		
		// Resolve: https://github.com/budiadiono/mongoose-slug-hero/issues/2
		
    var id

    async.series([

      // Create
      function (next) {
        new SimpleModel({ name: 'SpongeBob' }).save(function (err, doc) {
          if (err) throw err
          // Created normal slug
          id = doc.id
          doc.slug.should.equal('spongebob')
          next()
        })
      },

      // findOneAndUpdate
      function (next) {				
        SimpleModel.findOneAndUpdate({_id: id}, {
          name: 'Gary'
        }, { new: true }, function (err, doc) {
          doc.slug.should.equal('gary')
          next()
        })
      }

    ], done)

  })

  it('#2 - findOneAndUpdate should not erase fields', function (done) {
		
		// Investigation: https://github.com/budiadiono/mongoose-slug-hero/issues/1
		
    var Article = mongoose.model('Article'), Category = mongoose.model('Category', categorySchema)
    var articleId, categories = []

    async.series([

      // Create categories
      function (next) {
        var cat = new Category({
          name: 'cat'
        })
        cat.save(function (err, res) {
          categories.push(res._id)
          next()
        })

      },

      // Crate article
      function (next) {
        var article = new Article({
          category: categories,
          title: 'title',
          intro: 'intro',
          body: 'body',
          quote: 'quote',
          quote_citation: 'quote_citation',
          cover: 'cover',
          published: false
        })
        article.save(function (err, res) {
          articleId = res.id
          next()
        })
      },

      // findOneAndUpdate
      function (next) {
        Article.findOneAndUpdate({ _id: articleId },
          {
            title: 'the title',
            intro: 'intro1',
            body: 'body1',
            quote: 'quote1',
            quote_citation: 'quote_citation1',
            cover: 'cover1',
            published: true
          },
          {'new': true},
          function (err, article) {
            Article.findById(articleId, function (err, article) {
              article.title.should.eql('the title')
              article.intro.should.eql('intro1')
              article.body.should.eql('body1')
              article.quote.should.eql('quote1')
              article.quote_citation.should.eql('quote_citation1')
              article.cover.should.eql('cover1')
              article.published.should.eql(true)
              next()
            })

          })
      }
    ], done)

  })

})
