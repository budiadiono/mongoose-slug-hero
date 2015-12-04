'use strict';

/**
 * Slug generation test for model that has more than 1 field as a scope
 **/

var _ = require('lodash'),
	mongoose = require('mongoose'),
	hooks = require('../test-helper/drop-create-hooks'),
	should = require('should'),
	slugHero = require("../lib/mongoose-slug-hero");


describe('Customize options', function () {

	hooks();

	it('should be able to use custom options', function (done) {

		var customSchema = new mongoose.Schema({
			name: String
		});
		
		customSchema.plugin(slugHero, { 
			doc: 'simple', field: 'name', 
			counter: 'my_slug_counters',
			slugFieldName: 'my_slug', 
			slugsFieldName: 'my_slugs',
			slugOptions: {
				lower: false,
				replacement: '_'
			}
		});
		var CustomModel = mongoose.model('CustomizedModel', customSchema);

		var foundId;
		new CustomModel({ name: 'Sponge Bob' }).save(function (err, result) {
			if (err)
				throw err;
				
			foundId = result.id;
							
			// Slug should be generated in 'my_slug'
			result.my_slug.should.equal('Sponge_Bob');
			// There should be my_slugs
			should.exist(result.my_slugs);
			
			// Defaults should be gone
			should.not.exist(result.slug);
			should.not.exist(result.slugs);

			// The counter should be written in 'my_slug_counters' 
			mongoose.connection.db.collection('my_slug_counters', function (err, collection) {
				collection.find({}).toArray(function (err, res) {
					res[0]._id.should.equal('simple|name*Sponge Bob*');
					
					// Now find it					
					CustomModel.findBySlug('Sponge_Bob').exec(function(err, result){
						
						foundId.should.equal(result.id);
						
						done();
					});
					
					
				});
			});

		});

	});

});