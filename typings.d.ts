declare module 'mongoose-slug-hero' {
  import { Document, DocumentQuery, Model } from 'mongoose'

  export interface SlugHeroGlobalOptions {
    /**
     *  (global): The slug field name that will be added to the collection to store generated slug. Default: slug.
     */
    slugField?: string

    /**
     * (global): The slugs field name that will be added to the collection to store slug history. Default: slugs.
     */
    slugsField?: string

    /**
     * (global): Options for node-slug. Please refer to https://github.com/dodo/node-slug#options. Default: {lower: true}.
     */
    slugOptions?: any

    /**
     * (global): The name of collection to store sequences data. Default: _slug_ctrs.
     */
    counter?: string
  }

  export interface SlugHeroOptions extends SlugHeroGlobalOptions {
    /**
     * Name of slug-hero, this must be unique among collections. You can fill with the model name to make life easier.
     */
    doc: string

    /**
     * Name of your field that slug will generate for.
     */
    field: string

    /**
     * Array of field names for scope keys (see example: Scoped Slug).
     */
    scope?: string | string[]
  }

  /**
   * Model with mongoose slug hero functionalities.
   */
  export interface SlugHeroModel<T extends Document> extends Model<T> {
    /**
     * Generate slug if it's not exists yet.
     * @param callback done callback
     */
    ensureSlugIsExists(callback?: (err: any) => void)

    /**
     * Find document by slug.
     * @param slug slug value
     * @param callback done callback
     */
    findBySlug(
      slug: string,
      callback?: (err: any, result: T & Document) => void
    ): DocumentQuery<T[], T & Document>
  }

  import mongoose = require('mongoose')
  const pluginFn: (schema: mongoose.Schema) => void
  export default pluginFn
}
