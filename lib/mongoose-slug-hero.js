var mongoose = require('mongoose'),
	Schema = mongoose.Schema,
	slug = require('slug');

SlugHero.config = {
	
	/**
	 * Default global options
	 **/

	counter: '_slug_ctrs',
	slugFieldName: 'slug',
	slugsFieldName: 'slugs',
	slugOptions: { lower: true }
	
};

SlugHero.createCounterModel = function (collectionName) {
	
	/**
	* Build slug counters schema & model
	* This will add new collection [collectionName] in your db
	**/
		
	// Create slug counter schema
	var counterSchema = new Schema({
		'seq': { type: Number }
	});

	// Create 'nextSeq' static method. 
	// This method always return new incremental of model sequence  
	counterSchema.statics.nextSeq = function (key, cb) {
		this.collection.findAndModify(
			
			// Filled with the document name and scope key combination
			{ _id: key },
			
			// Order of sequence field to return -- Hmm... I think this is not necessary 
			[['seq', 'descending']],
			
			// Always increment the sequence by 1
			{ $inc: { seq: 1 } },

			{ 
				// Always return new sequence
				new: true, 
				
				// Create new if it' not exists
				upsert: true
			},
			
			// Return new value
			function (err, res) {
				
				// If error, it's not my business!
				if (err) throw err;
				
				// Just feed new sequence for callback
				cb(res.value.seq);
			});
	};

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
		var filter1 = {}; filter1[slugFieldName] = key;
		var filter2 = {}; filter2[slugsFieldName] = key;
		return this.findOne({ $or: [filter1, filter2] }, cb);
	}

	// Hook pre-save middleware, slug will be generated here
	schema.pre('save', true, function (next, done) {
		var _this = this,
			slg = slug(_this[slugField], slugOptions),
			key = doc + '|';
		
		// Build scope key
		for (var i = 0; i < scope.length; i++) {
			var k = scope[i];
			key += k + '*' + (_this[k] || '?') + '*';
		}
		
		// Let the other hooks rolls
		next();
		
		
		// End of world war z
		function finish() {
			
			// Get next counter within scope	
			Counters.nextSeq(key, function (seq) {
				
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

			_this.constructor.findOne({ _id: _this.id }, function (err, old) {
				
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