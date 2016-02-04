/**
 * Testing models
 **/

var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  model = mongoose.model,
  slugHero = require('../lib/mongoose-slug-hero')


//
// Simple model without scope
//
var simpleModelSchema = new Schema({
  'name': {
    type: String,
    required: true
  },
	'foo': String
})
simpleModelSchema.plugin(slugHero, {doc: 'simple', field: 'name'})

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
  },
	'foo': String
})
scopedModelSchema.plugin(slugHero, {doc: 'scoped', scope: ['owner'], field: 'name'})

//
// Model with advanced scope
//
var advancedScopedModelSchema = new Schema({
  'name': {
    type: String,
    required: true
  },
  'owner': {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SimpleModel',
    required: true,
    index: true
  },
	'foo': String
})
advancedScopedModelSchema.plugin(slugHero, {doc: 'advancedScoped', scope: ['owner'], field: 'name'})

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
})
multiScopeModelSchema.plugin(slugHero, {doc: 'multi-scope', scope: ['owner1', 'owner2'], field: 'name'})

//
// Schema with dot notation
//
var dottedModelSchema = new Schema({
  name: String,
  info: {
    title: String,
    subtitle: String
  }
})

dottedModelSchema.plugin(slugHero, {
  doc: 'dottedModelSchema',
  field: 'info.title',
  slugFieldName: 'config.slug',
  slugsFieldName: 'config.slugs'
})


//
// Schema with dot notation with scope
//
var dottedScopedModelSchema = new Schema({
  name: String,
  info: {
    title: String,
    subtitle: String
  },
	group: {
		name: String
	}
})

dottedScopedModelSchema.plugin(slugHero, {
  doc: 'dottedScopedModelSchema',
  field: 'info.title',
  slugFieldName: 'config.slug',
  slugsFieldName: 'config.slugs',
	scope: ['group.name']
})

module.exports = {
  Simple: mongoose.model('SimpleModel', simpleModelSchema),
  Scoped: mongoose.model('ScopedModel', scopedModelSchema),
	AdvancedScoped: mongoose.model('AdvancedScoped', advancedScopedModelSchema),
  MultiScope: mongoose.model('MultiScopedModel', multiScopeModelSchema),
	DottedModel: mongoose.model('dottedModelSchema', dottedModelSchema),
	DottedScopedModel: mongoose.model('dottedScopedModelSchema', dottedScopedModelSchema)
}
