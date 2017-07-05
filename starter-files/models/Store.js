const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const slug = require('slugs');

const storeSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required: 'Please enter a store name!',
  },
  slug: String,
  description: {
    type: String,
    trim: true,
  },
  tags: [String],
  created: {
    type: Date,
    default: Date.now,
  },
  location: {
    type: {
      type: String,
      default: 'Point',
    },
    coordinates: [
      {
        type: Number,
        required: 'You must supply coordinates!',
      },
    ],
    address: {
      type: String,
      required: 'You must supply an address!',
    },
  },
  photo: String,
  author: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: 'You must supply an author',
  },
},
  {
    toJSON: {virtuals: true}, //By default virtual fields are not converted. So we can access them by requestin the correct property but if we print the object, we don't see them
    toObject: {virtuals: true}
  }
);

//define our indexes
storeSchema.index({
  name: 'text',
  description: 'text',
});

storeSchema.index({
  location: '2dsphere',
});

storeSchema.pre('save', async function(next) {
  if (!this.isModified('name')) {
    return next(); //skip it
  }
  this.slug = slug(this.name);
  //find others store with same slug
  const slugRegEx = new RegExp(`^(${this.slug})((-[0-9]*$)?)`, 'i');
  const storeWithSlug = await this.constructor.find({ slug: slugRegEx });
  if (storeWithSlug.length) {
    this.slug = `${this.slug}-${storeWithSlug.length + 1}`;
  }
  next();
});

storeSchema.statics.getTagsList = function() {
  return this.aggregate([
    { $unwind: '$tags' },
    { $group: { _id: '$tags', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
};

storeSchema.statics.getTopStores = function () {
  return this.aggregate([
    //Lookup stores and populate their reviews (we can't use the virtual field)
    { $lookup: { from: 'reviews', localField: '_id', foreignField: 'store', as: 'reviews' } },
    // filter for only items that have 2 or more reviews
    {$match: {'reviews.1': {$exists: true}}}, //where second item (reviews.1) exist
    // add the average reviews field
    {
      $project: { // mongoDb 3.2 remove all the other fields. Version 3.4 include $addField which correct that
        photo: '$$ROOT.photo',
        name: '$$ROOT.name',
        reviews: '$$ROOT.reviews',
        slug: '$$ROOT.slug',
        averageRating: { $avg: '$reviews.rating'}
    }},
    // sort it by our new field, hihest first
    {$sort: {averageRating: -1}},
    // limit to at most 10
    {$limit: 10}
  ])
}

function autoPopulate(next) {
  this.populate('reviews');
  next();
}

storeSchema.pre('find', autoPopulate);
storeSchema.pre('findOne', autoPopulate);

//find reviews where the stores _id property === reviews store property
storeSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id', // which field on the store
  foreignField: 'store' //which field on the review
})

module.exports = mongoose.model('Store', storeSchema);
