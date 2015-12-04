'use strict';

/**
 * Slug generation test for model simple model with no scope
 **/


var _ = require('lodash'),
	hooks = require('../test-helper/drop-create-hooks'),
	should = require('should'),
	async = require('async'),
	SimpleModel = require('../test-helper/models').Simple;


describe('Simple Model Test', function () {

	hooks();

	describe("#create single simple model", function () {
		it('should generate correct slug', function (done) {
			var model = new SimpleModel({ name: 'SpongeBob' });
			model.save(function (err, result) {
				if (err)
					throw err;
				result.slug.should.equal('spongebob');
				done();
			});
		});
	});

	describe('#create simple model', function () {

		var task = function (cb) {
			SimpleModel.create({ name: 'SpongeBob' }, function (err, result) {
				if (err)
					throw err;
				cb(null, result.slug);
			});
		}, tasks = [];

		for (var i = 0; i < 10; i++) {
			tasks.push(task);
		}

		it('should generate unique slugs', function (done) {

			async.parallel(tasks, function (err, slugs) {

				var expectedSlugs =
					['spongebob', 'spongebob-2', 'spongebob-3', 'spongebob-4', 'spongebob-5',
						'spongebob-6', 'spongebob-7', 'spongebob-8', 'spongebob-9', 'spongebob-10'];

				// Ensure results
				slugs.length.should.match(expectedSlugs.length);
				_.each(slugs, function (slug) {
					expectedSlugs.should.matchAny(slug);
				});
              
				// Ensure for uniqueness again, for sure
				var recordedSlugs = [];
				_.each(slugs, function (slug) {
					recordedSlugs.should.not.matchAny(slug);
					recordedSlugs.push(slug);
				});

				done();
			});

		});

	});

});