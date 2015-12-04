/**
 * Testing models
 **/

var mongoose = require("mongoose"),
	Schema = mongoose.Schema,
	model = mongoose.model,
	slugHero = require("../lib/mongoose-slug-hero");
	

//
// Simple model without scope
//
var simpleModelSchema = new Schema({
	'name': {
		type: String,
		required: true
	}	
});
simpleModelSchema.plugin(slugHero, {doc: 'simple', field: 'name'});


//
// Model with 1 field as scope
//
var scopedModelSchema = new Schema({
	'name': {
		type: String,
		required: true
	},
	'owner': {
		type: String,
		required: true,
	}
});
scopedModelSchema.plugin(slugHero, {doc:'scoped', scope:['owner'], field: 'name'});


//
// Model with 2 fields as scope
//
var multiScopeModelSchema = new Schema({
	'name': {
		type: String,
		required: true
	},
	'owner1': {
		type: String,
		required: true,
	},
	'owner2': {
		type: String,
		required: true,
	}
});
multiScopeModelSchema.plugin(slugHero, {doc:'multi-scope', scope:['owner1', 'owner2'], field: 'name'});


module.exports = {
	Simple: mongoose.model('SimpleModel', simpleModelSchema),
	Scoped: mongoose.model('ScopedModel', scopedModelSchema),
	MultiScope: mongoose.model('MultiScopedModel', multiScopeModelSchema),
}