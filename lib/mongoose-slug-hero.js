var mongoose = require('mongoose'),
	Schema = mongoose.Schema,
	slug = require('slug'),
	_ = require('lodash');

/**
* Default global options
**/
SlugHero.config = {	
	counter: '_slug_ctrs',
	slugFieldName: 'slug',
	slugsFieldName: 'slugs',
	slugOptions: { lower: true }
};


/**
* Build slug counters schema & model
* This will add new collection [collectionName] in your db
**/
SlugHero.createCounterModel = function (collectionName) {
	
	var counterSchema = new Schema({
		'_id': { type: String },
		'seq': { type: Number }
	});

	return mongoose.model(collectionName, counterSchema);
}

/**
 * Global variable to store counter collection names
 **/
SlugHero.Counters = [];

function SlugHero(schema, options) {

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
		slugAttrs = {};


	// Prepare the Counters to use
	if (!SlugHero.Counters[counterCollectionName]) {
		SlugHero.Counters[counterCollectionName] = SlugHero.createCounterModel(counterCollectionName);
	}
	var Counters = SlugHero.Counters[counterCollectionName];	
		
	// Define scope keys
	if (!scope)
		scope = [];
	
	// Add slug field as a member of keys
	if (scope.indexOf(slugField) < 0)
		scope.push(slugField);
		
	// Add slug field to target schema
	slugAttrs[slugFieldName] = {
		type: String,
		index: true
	};
	slugAttrs[slugsFieldName] = {
		type: [String],
		index: true
	};
	schema.add(slugAttrs);
	
	// Create 'findBySlug' static methods
	schema.statics.findBySlug = function (key, cb) {
		var filter1 = {}, filter2 = {}; 
		if (_.isString(key)) {		
			filter1[slugFieldName] = key;
			filter2[slugsFieldName] = key;
			return this.findOne({ $or: [filter1, filter2] }, cb);
		} else {
			
			var slug = key.slug,
				owners = {};
			delete key.slug;
						
			_.each(_.keys(key), function(k){				
				owners[k] = key[k];	
			})
			
			filter1[slugFieldName] = slug;
			filter2[slugsFieldName] = slug;			
			return this.findOne({ $and: [ owners, { $or: [filter1, filter2] } ] }, cb);
		}
	}

	// Hook pre-save middleware, slug will be generated here
	schema.pre('save', true, function (next, done) {
		var _this = this,
			slg = slug(_this[slugField], slugOptions),
			key = doc + '|';
		
		// Let the other hooks rolls
		next();
		
		// Build scope key
		for (var i = 0; i < scope.length; i++) {
			var k = scope[i];
			key += k + '*' + (_this[k] || '?') + '*';
		}
				
		// End of world war z
		function finish() {
			
			// Get next counter within scope	
			Counters.findByIdAndUpdate(key, { $inc: { seq: 1 } }, { upsert: true, new: true }, function (err, res) {				
				if (err) throw err;

				var seq = res.seq;
				
				// If found more than one, then add suffix to the slug
				if (seq > 1)
					slg = slg + '-' + seq;
					
				// Set and done
				_this[slugFieldName] = slg;
				
				done();
			});
		}

		if (_this.isNew) {

			finish();

		} else {

			_this.constructor.findById(_this.id, function (err, old) {
				
				// Determine is the slug field value changed
				if (old[slugField] == _this[slugField]) {
					
					// Nothing changes
					done();
				} else {
					
					// Changed, add old slug value to the slugs as a history
					_this.slugs.push(_this.slug);

					finish();
				}
			});
		}
	});
}


module.exports = SlugHero;