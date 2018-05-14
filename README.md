# Mongoose Slug Hero

[![Build Status](https://travis-ci.org/budiadiono/mongoose-slug-hero.svg?branch=master)](https://travis-ci.org/budiadiono/mongoose-slug-hero)

**Mongoose Slug Hero** is a mongoose plugin to generate unique sequential slug. 
This plugin uses [node-slug](https://github.com/dodo/node-slug) module to generate 
slug from targeted field. To guarantee the uniqueness, this plugin uses sequence 
collection to track the number of used slug -- inspired by [mongoose-sequence](https://github.com/ramiel/mongoose-sequence) plugin.

Generated slug stored in your collection in field named `slug`.  

## We do respect a history

When you edit your data the slug will be automatically changed based to the new updated data.
But the old slug still alive. Thus we respect this history by storing the old slug to the 
`slugs` field in your target collection.

Slugs that belongs to deleted data will also not reused.

## Find data by slug

This plugin automatically create static method for your schema called `findBySlug`. 
You can find your data by invoking this method by supplying whether the current slug or old slug.

## Installation

``npm install mongoose-slug-hero``

## Options

* **doc** (required): Name of slug-hero, this must be unique among collections. You can fill with the model name to make life easier. 
* **field** (required): Name of your field that slug will generate for.
* **scope** (optional): Array of field names for scope keys *(see example: [Scoped Slug](#scoped-slug))*.
* **slugField** (optional / **global**): The slug field name that will be added to the collection to store generated slug. *Default: `slug`*.
* **slugsField** (optional / **global**): The slugs field name that will be added to the collection to store slug history. *Default: `slugs`*.
* **slugOptions** (optional / **global**): Options for node-slug. Please refer to https://github.com/dodo/node-slug#options. *Default: `{lower: true}`*.
* **counter** (optional / **global**): The name of collection to store sequences data.  *Default: `_slug_ctrs`*.

## Global Options / Config

You can set those options above marked with **global** once for all in the **very begining** of your code.
For example you want to always use `slug_counters` as your collection to store sequences, then you do this:
```
var slugHero = require('mongoose-slug-hero');
slugHero.config.counter = 'slug_counters'

// You can do same thing for slugField, slugsField or slugOptions
```

## Usage Example

### Simple Slug

```
var slugHero = require('mongoose-slug-hero'),
	mongoose = require('mongoose'),
	fooSchema = new mongoose.Schema({
		name: String
	});

fooSchema.plugin(slugHero, {doc: 'foo', field: 'name'});

var Foo = mongoose.model('Foo', fooSchema);

var foo = new Foo({ name: 'SpongeBob' });
foo.save(); // foo.slug => 'spongebob'
```
Next time you create another Foo
```
var foo = new Foo({ name: 'SpongeBob' });
foo.save(); // foo.slug => 'spongebob-2'
```

### Scoped Slug

It is like a composite key, that slug should be unique within same referenced key.
For example that each user's post should be only unique according to the user:
```
var postSchema = new mongoose.Schema({userId: Number, post: String});
postSchema.plugin(slugHero, {doc: 'post', field: 'post', scope:['userId']});

var Post = mongoose.model('Post', postSchema);

// create 1st post
(new Post({userId: 1, post: 'Great post ever'})).save(); // post.slug => 'great-post-ever' 

// secondly with same user and same post...
(new Post({userId: 1, post: 'Great post ever'})).save(); // post.slug => 'great-post-ever-2'

// now with different user and same post...
(new Post({userId: 2, post: 'Great post ever'})).save(); // post.slug => 'great-post-ever'

// and so on...
```

### Finding The Slug

**findBySlug** method returning mongoose query, except that the parameter is slug itself.
So you can do mongoose query syntax like here.

Either `<Model>.findBySlug(<slug_or_options>, [callbak]);` or `<Model>.findBySlug(<slug_or_options>).exec([callbak]);`

Example:
```
Post.findBySlug('great-post-ever', function(err, result) {
	// 'result' is what we looking for 	
});
```
or
```
Post.findBySlug('great-post-ever').exec(function(err, result) {
	// 'result' is what we looking for 	
});
```
For scoped slug, you can feed first parameter with an object instead of slug. 
For example you want to find data belongs to `userId` with value `1`:
```
Post.findBySlug({slug: 'great-post-ever', userId: 1}).exec(function(err, result) {
	// 'result' is what we looking for 	
});
```

### Generate slug to existing document

You can call **ensureSlugIsExists** method to generate slug into existing document.
For example you have a schema and model like this:

```
var schema = new mongoose.Schema({
	name: String
})

var MyModel = mongoose.model('MyModel', schema)

```

Then you release your app and of course `MyModel` now filled with many data.

Now you change your mind, that you want to have a slug to your `MyModel`. All you have to do is:

1. Change your schema to have `mongoose-slug-hero` plugged.
	```
	schema.plugin(slugHero, {doc: 'my-model', field: 'name'})
	```
2. Call **ensureSlugIsExists** right after model initialization:
	```
	MyModel.ensureSlugIsExists(function (error) {
		if (error) {
			throw error
		}

		console.log('success!')
	})
	```



## License

[MIT](https://github.com/budiadiono/mongoose-slug-hero/blob/master/LICENSE)
