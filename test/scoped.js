'use strict';

/**
 * Slug generation test for model that has only 1 field as a scope
 **/


var _ = require('lodash'),
	hooks = require('../test-helper/drop-create-hooks'),
	should = require('should'),
	ScopedModel = require('../test-helper/models').Scoped;



describe('Scoped Model Test', function () {

	hooks();

	describe("#generate different sequences for each scope", function () {

		it('should generate correct slugs', function (done) {

			var model = { name: 'SpongeBob', owner: 'Squidward' };

			// First 
			new ScopedModel(model).save(function (err, result) {

				result.slug.should.equal('spongebob');

				// Second, same owner
				new ScopedModel(model).save(function (err, result) {
					result.slug.should.equal('spongebob-2');
          
					// Third, different owner
					model.owner = 'Patrick';
					new ScopedModel(model).save(function (err, result) {
						result.slug.should.equal('spongebob');

						// Fourth, same previous owner
						new ScopedModel(model).save(function (err, result) {
							result.slug.should.equal('spongebob-2');
							done();
						}); // Fourth
          
					}); // Third
        
				}); // Second
        
			}); // First
      
		});
    
		//  it('should generate correct slug', function (done) {
		//   var model = new ScopedModel({ name: 'SpongeBob', owner: 'Squidward' });
		//   model.save(function (err, result) {
		//     if (err)
		//       throw err;
		//     result.slug.should.equal('spongebob-2');
		//     done();
		//   });
		// });
    
    
    
    
	});

});