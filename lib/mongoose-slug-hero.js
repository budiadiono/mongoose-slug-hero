var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  slug = require('slug'),
  _ = require('lodash')

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
SlugHero.createCounterModel = function (collectionName) {
  var counterSchema = new Schema({
    '_id': { type: String },
    'seq': { type: Number }
  })

  return mongoose.model(collectionName, counterSchema)
}

/**
 * Global variable to store counter collection names
 **/
SlugHero.Counters = []

function SlugHero (schema, options) {
  var
  // --------- options --------- //

    // target doc/collection name (required)
    doc = options.doc,

    // scope keys for slug (optional)
    scope = options.scope,

    // the field to be slugged (required)
    slugField = options.field,

    // field name for storing slug (optional / global)
    slugFieldName = options.slugFieldName || SlugHero.config.slugFieldName,

    // field name for storing slugs (optional / global)
    slugsFieldName = options.slugsFieldName || SlugHero.config.slugsFieldName,

    // node-slug options, refer to https://github.com/dodo/node-slug#options (optional / global)
    slugOptions = options.slugOptions || SlugHero.config.slugOptions,

    // collection name to save sequences (optional / global)
    counterCollectionName = options.counter || SlugHero.config.counter,

    // --------- not options --------- //

    // slug fields to be added to the schema 
    slugAttrs = {}

  // Prepare the Counters to use
  if (!SlugHero.Counters[counterCollectionName]) {
    SlugHero.Counters[counterCollectionName] = SlugHero.createCounterModel(counterCollectionName)
  }
  var Counters = SlugHero.Counters[counterCollectionName]

  // Define scope keys
  if (!scope)
    scope = []

  // Add slug field as a member of keys
  if (scope.indexOf(slugField) < 0)
    scope.push(slugField)

  // Add slug field to target schema
  slugAttrs[slugFieldName] = {
    type: String,
    index: true
  }
  slugAttrs[slugsFieldName] = {
    type: [String],
    index: true
  }
  schema.add(slugAttrs)

  // Create 'findBySlug' static methods
  schema.statics.findBySlug = function (key, cb) {
    var filter1 = {}, filter2 = {}
    if (_.isString(key)) {
      filter1[slugFieldName] = key
      filter2[slugsFieldName] = key
      return this.findOne({ $or: [filter1, filter2] }, cb)
    } else {
      var slug = key.slug,
        owners = {}
      delete key.slug

      _.each(_.keys(key), function (k) {
        owners[k] = key[k]
      })

      filter1[slugFieldName] = slug
      filter2[slugsFieldName] = slug
      return this.findOne({ $and: [ owners, { $or: [filter1, filter2] } ] }, cb)
    }
  }

  schema.pre('findOneAndUpdate', function (done) {
    var _this = this,
			
			// Find updated data
			updates = _this._update,
      updatedFields = _.keys(updates)

    if (updatedFields.indexOf(slugField) > -1) {
			// There is a change on slug
			
			// New entered slug
      var newVal = updates[slugField]

      _this.findOne({}, function (err, old) {
				
				// Make sure slug were changed (let me know if this is not worthly)
        if (old[slugField] == _this[slugField]) {
          // Nothing changes
          done()
					
        } else {
					
					var oldSlug = old[slugFieldName]
					
					// Early store new slug value to get buildOptions works 
          old[slugField] = newVal
          
					// Build the new slug
          finish(old, true, function (err, slg) {
						
						// Do manual update since this is a Query Middleware
						
            var slgUpdate = {},
							historyUpdate = {}
							
            slgUpdate[slugFieldName] = slg
						historyUpdate[slugsFieldName] = oldSlug

            _this.update({}, {$set: slgUpdate, $push: historyUpdate})

            done(err)
          })
        }

      })
    } else {
			// There's no change
      done()
    }
  })

  // Hook pre-save middleware, slug will be generated here
  schema.pre('save', true, function (next, done) {
    // Let the other hooks rolls
    next()

    var _this = this

    if (_this.isNew) {
      finish(_this, false, done)

    } else {
      _this.constructor.findById(_this.id, function (err, old) {
        // Determine is the slug field value changed
        if (old[slugField] == _this[slugField]) {
          // Nothing changes
          done()

        } else {
          // Changed, add old slug value to the slugs as a history          
          finish(_this, true, done)
        }
      })
    }
  })

  // End of world war z
  function finish (data, update, done) {
		
		var opt = buildOptions(data)
		
		// store old slug
    if (update) {
      data.slugs.push(data[slugFieldName])
    }

    // Get next counter within scope	
    Counters.findByIdAndUpdate(opt.key, { $inc: { seq: 1 } }, { upsert: true, new: true }, function (err, res) {
      if (err) throw err

      var seq = res.seq,
        slg = opt.slg

      // If found more than one, then add suffix to the slug
      if (seq > 1)
        slg = slg + '-' + seq

      // store new slug
      data[slugFieldName] = slg

      done(null, slg)
    })
  }
	
	function buildOptions (data) {
    var slg = slug(data[slugField], slugOptions),
      key = doc + '|'

    // Build scope key
    for (var i = 0; i < scope.length; i++) {
      var k = scope[i]
      key += k + '*' + (data[k] || '?') + '*'
    }

    return {
      slg: slg,
      key: key
    }
  }

}

module.exports = SlugHero
