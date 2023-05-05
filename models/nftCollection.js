const { number } = require("joi");
const mongoose = require("mongoose");
const slugify = require("slugify");
const validator = require("validator");

const nftCollectionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "A Collection must have a name"],
      unique: true,
      trim: true,
      maxlength: [40, "nft must have 40 character"],
      minlength: [10, "nft must have 10 character"],
      // validate: [validator.isAlpha, "NFT name must only contain
    },
    seller: {
      type: String,
      default: false
    },
    slug: String,
    duration: {
      type: String,
      default: false,
    },
    collectionDescription: {
      type: String,
      trim: true,
    },
    collectionImageCover: {
      type: String,
      default: false,
    },
    collectionImage: String,
    startDates: {
      type: Date,
      default: Date.now(),
      select: false
    },
    category: {
      type: String,
      default: false,
    },
  },  
  {
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  }
  
);

nftCollectionSchema.virtual("durationWeeks").get(function () {
  return this.duration / 7;
});

//MONGOOSE MIDDLEWARE

//DOCUMNT MIDDLEWARE: runs before .save() or .create()
nftCollectionSchema.pre("save", function (next) {
  console.log(this);
  this.slug = slugify(this.name, { lower: true });
  next();
});

//QYERY MIDDLEWARE

//---------pre
// nftCollectionSchema.pre("find", function (next) {
    nftCollectionSchema.pre(/^find/, function (next) {
    this.find({ secretNfts: { $ne: true } });
    this.start = Date.now();
    next();
  });

  //-----post
nftCollectionSchema.post(/^find/, function (doc, next) {
  console.log(`Query took time: ${Date.now() - this.start} times`);
  // console.log(doc);
  next();
});

//AGGREATION MIDDLEWARE
nftCollectionSchema.pre("aggregate", function (next) {
  this.pipeline().unshift({ $match: { secretNfts: { $ne: true } } });
  // console.log(this.pipeline());
  next();
});
const NFTCollection = mongoose.model("NFTCollection", nftCollectionSchema);

module.exports = NFTCollection;