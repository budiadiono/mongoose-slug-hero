'use strict';

/**
 * Mocha hooks to always clear & drop db for each test
 * Thanks to: http://www.scotchmedia.com/tutorials/express/authentication/1/06
 **/ 

var mongoose = require('mongoose'),
	db = 'mongodb://127.0.0.1/slugherodbtest';

module.exports = function () {

	before('Clear database', function (done) {

		function clearDB() {			
			for (var i in mongoose.connection.collections) {
				mongoose.connection.collections[i].remove(function () { });
			}
			return done();
		}

		if (mongoose.connection.readyState === 0) {
			mongoose.connect(db, function (err) {
				if (err) {
					throw err;
				}
				return clearDB();
			});
		} else {
			return clearDB();
		}
		
	});

	after('Clear and drop database', function (done) {
		
		mongoose.connection.db.dropDatabase(function (err) {
			if (err) return done(err);			
			mongoose.disconnect(done);
		});
		
	});

}