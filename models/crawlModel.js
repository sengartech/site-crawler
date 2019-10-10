/**
 * module dependencies.
 */
let mongoose = require('mongoose');
let Schema = mongoose.Schema

let crawlSchema = new Schema({
  createdOn: {
    type: Date,
    default: Date.now
  },
  modifiedOn: {
    type: Date,
    default: Date.now
  },
  url: {
    type: String,
    required: true
  },
  referenceCount: {
    type: Number,
    default: 1
  },
  parameterList: {
    type: Array,
    default: []
  }
})

mongoose.model('crawlModel', crawlSchema);
