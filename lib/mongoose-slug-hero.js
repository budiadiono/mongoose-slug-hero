'use strict'

var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  slug = require('slug'),
  _ = require('lodash')

var SlugHero

/**
 * Default global options
 **/
SlugHero.config = {
  counter: '_slug_ctrs',
  slugFieldName: 'slug',
  slugsFieldName: 'slugs',
  slugOptions: { lower: true }
}

/**
 * Build slug counters schema & model
 * This will add new collection [collectionName] in your db
 **/
SlugHero.createCounterModel = function(collectionName) {
  var counterSchema = new Schema({
    _id: { type: String },
    seq: { type: Number }
  })

  return mongoose.model(collectionName, counterSchema)
}

/**
 * Global variable to store counter collection names
 **/
SlugHero.Counters = []

function SlugHero(schema, options) {
  var // --------- options --------- //

    // target doc/collection name (required)
    doc = options.doc,
    // scope keys for slug (optional)
    scope = options.scope,
    // the field to be slugged (required)
    slugField = options.field,
    // field name for storing slug (optional / global)
    slugFieldName =
      options.slugField ||
      options.slugFieldName ||
      SlugHero.config.slugField ||
      SlugHero.config.slugFieldName,
    // field name for storing slugs (optional / global)
    slugsFieldName =
      options.slugsField ||
      options.slugsFieldName ||
      SlugHero.config.slugsField ||
      SlugHero.config.slugsFieldName,
    // node-slug options, refer to https://github.com/dodo/node-slug#options (optional / global)
    slugOptions = options.slugOptions || SlugHero.config.slugOptions,
    // collection name to save sequences (optional / global)
    counterCollectionName = options.counter || SlugHero.config.counter,
    // --------- not options --------- //

    // slug fields to be added to the schema
    slugAttrs = {}

  // Prepare the Counters to use
  if (!SlugHero.Counters[counterCollectionName]) {
    SlugHero.Counters[counterCollectionName] = SlugHero.createCounterModel(
      counterCollectionName
    )
  }
  var Counters = SlugHero.Counters[counterCollectionName]

  // Define scope keys
  if (!scope) {
    scope = []
  }

  // Add slug field as a member of keys
  if (scope.indexOf(slugField) < 0) {
    scope.push(slugField)
  }

  // Add slug field to target schema
  _.set(slugAttrs, slugFieldName, {
    type: String,
    index: true
  })

  _.set(slugAttrs, slugsFieldName, {
    type: [String],
    index: true
  })

  schema.add(slugAttrs)

  //
  // Determine is the slug field value changed
  //
  function hasChanged(newData, oldData) {
    var changed = false
    for (var i = 0; i < scope.length; i++) {
      var k = scope[i],
        newVal = _.get(newData, k),
        oldVal = _.get(oldData, k)
      if (!_.isEqual(newVal, oldVal)) {
        changed = true
        break
      }
    }

    return changed
  }

  //
  // Build options
  //
  function buildOptions(data) {
    var slg = slug(_.get(data, slugField), slugOptions),
      key = doc + '|'

    // Build scope key
    for (var i = 0; i < scope.length; i++) {
      var k = scope[i]
      key += k + '*' + (_.get(data, k) || '?') + '*'
    }

    return {
      slg: slg,
      key: key
    }
  }

  //
  // Build slug
  //
  function buildSlug(data, update, done) {
    var opt = buildOptions(data)

    // store old slug
    if (update) {
      _.get(data, slugsFieldName).push(_.get(data, slugFieldName))
    }

    // Get next counter within scope
    Counters.findByIdAndUpdate(
      opt.key,
      { $inc: { seq: 1 } },
      { upsert: true, new: true },
      function(err, res) {
        if (err) {
          throw err
        }

        var seq = res.seq,
          slg = opt.slg

        // If found more than one, then add suffix to the slug
        if (seq > 1) {
          slg = slg + '-' + seq
        }

        // store new slug
        _.set(data, slugFieldName, slg)

        done(null, slg)
      }
    )
  }

  //
  // Create 'findBySlug' static methods
  //
  schema.statics.findBySlug = function(key, cb) {
    var filter1 = {},
      filter2 = {}
    if (_.isString(key)) {
      filter1[slugFieldName] = key
      filter2[slugsFieldName] = key
      return this.findOne({ $or: [filter1, filter2] }, cb)
    } else {
      var slug = key.slug,
        owners = {}
      delete key.slug

      _.each(_.keys(key), function(k) {
        owners[k] = key[k]
      })

      filter1[slugFieldName] = slug
      filter2[slugsFieldName] = slug
      return this.findOne({ $and: [owners, { $or: [filter1, filter2] }] }, cb)
    }
  }

  //
  // Ensure that slugs generated.
  //
  schema.statics.ensureSlugIsExists = function(cb) {
    this.find({
      $and: [
        { [slugFieldName]: { $exists: false } },
        { [slugsFieldName]: { $exists: false } }
      ]
    })
      .then(items => {
        var count = 0
        _.each(items, function(p) {
          buildSlug(p, false, function(err, slug) {
            if (!err) {
              p.save(function(err) {
                if (err) {
                  cb(err)
                }

                count++
                if (cb && count >= items.length) {
                  cb()
                }
              })
            }
          })
        })
      })
      .catch(cb)
  }

  //
  // Hook pre-findOneAndUpdate middleware, slug will be generated here
  //
  schema.pre('findOneAndUpdate', function(done) {
    var _this = this,
      // Find updated data
      updates = _this._update,
      // New entered scope values
      newVal = {}

    for (var i = 0; i < scope.length; i++) {
      var k = scope[i]
      var data = _.get(updates, k)
      if (data) {
        _.set(newVal, k, data)
      }
    }

    if (!_.isEmpty(newVal)) {
      _this.findOne({}, function(err, old) {
        if (!hasChanged(newVal, old)) {
          // Nothing changes
          done()
        } else {
          var oldSlug = _.get(old, slugFieldName)

          // Early store new slug value to get buildOptions works
          _.each(scope, function(k, v) {
            _.set(old, k, _.get(newVal, k))
          })

          // Build the new slug
          buildSlug(old, true, function(err, slg) {
            // Do manual update since this is a Query Middleware

            var slgUpdate = {},
              historyUpdate = {}

            slgUpdate[slugFieldName] = slg
            historyUpdate[slugsFieldName] = oldSlug

            _this.update({}, { $set: slgUpdate, $push: historyUpdate })

            done(err)
          })
        }
      })
    } else {
      // There's no change
      done()
    }
  })

  //
  // Hook pre-save middleware, slug will be generated here
  //
  schema.pre('save', true, function(next, done) {
    // Let the other hooks rolls
    next()

    var _this = this

    if (_this.isNew) {
      buildSlug(_this, false, done)
    } else {
      _this.constructor.findById(_this.id, function(err, old) {
        if (!hasChanged(_this, old)) {
          // Nothing changes
          done()
        } else {
          // Changed, add old slug value to the slugs as a history
          buildSlug(_this, true, done)
        }
      })
    }
  })
}

module.exports = SlugHero
