'use strict';

/**
 * Slug generation test for model that has more than 1 field as a scope
 **/

var _ = require('lodash'),
	mongoose = require('mongoose'),
	hooks = require('../test-helper/drop-create-hooks'),
	should = require('should'),
	slugHero = require("../lib/mongoose-slug-hero");
	
		

describe('Configuration Test', function () {

	hooks();
	
	describe('#custom config', function () {
		
		it('initial counter collection name should be "_slug_ctrs"', function(done){			
			'_slug_ctrs'.should.equal(slugHero.config.counter);
			done();
		});
		
		it('you can use "custom_slug_counters" as counter collection', function (done) {
			
			slugHero.config.counter = 'custom_slug_counters';
			var customSchema = new mongoose.Schema({
				name: String	
			});
			customSchema.plugin(slugHero, {doc: 'simple', field: 'name', counter: 'custom_slug_counters'});			
			var	CustomModel = mongoose.model('CustomModel', customSchema);
			
			new CustomModel({ name: 'SpongeBob' }).save(function (err, result) {
				if (err)
					throw err;
				
				// Slug should be generated indicated that counter is work
				result.slug.should.equal('spongebob');

				// The counter should be written in '_slug_ctrs' 
				mongoose.connection.db.collection('custom_slug_counters', function (err, collection) {
					collection.find({}).toArray(function (err, res) {
						res[0]._id.should.equal('simple|name*SpongeBob*');
						done();
					});
				});

			});
		});
		
		
		it('you can use "custom_slug_counters" as counter collection for another model', function (done) {
			
			slugHero.config.counter = 'custom_slug_counters';
			var anotherCustomSchema = new mongoose.Schema({
				name: String	
			});
			anotherCustomSchema.plugin(slugHero, {doc: 'simple', field: 'name', counter: 'custom_slug_counters'});			
			var	AnotherCustomModel = mongoose.model('AnotherCustomModel', anotherCustomSchema);
			
			new AnotherCustomModel({ name: 'SpongeBob' }).save(function (err, result) {
				if (err)
					throw err;
				
				// Slug should be generated indicated that counter is work
				result.slug.should.equal('spongebob');

				// The counter should be written in '_slug_ctrs' 
				mongoose.connection.db.collection('custom_slug_counters', function (err, collection) {
					collection.find({}).toArray(function (err, res) {
						res[0]._id.should.equal('simple|name*SpongeBob*');
						done();
					});
				});

			});
		});
		
		it('should use "_slug_ctrs" as default counter collection', function (done) {
			
			var SimpleModel = require('../test-helper/models').Simple;
			
			new SimpleModel({ name: 'SpongeBob' }).save(function (err, result) {
				if (err)
					throw err;
				
				// Slug should be generated indicated that counter is work
				result.slug.should.equal('spongebob');

				// The counter should be written in '_slug_ctrs' 
				mongoose.connection.db.collection('_slug_ctrs', function (err, collection) {
					collection.find({}).toArray(function (err, res) {
						res[0]._id.should.equal('simple|name*SpongeBob*');
						done();
					});
				});

			});
		});
	});


});