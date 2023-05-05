const { number } = require("joi");
const mongoose = require("mongoose");
const slugify = require("slugify");
const validator = require("validator");

const nftSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "A NFT must have a name"],
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
    fileSize: {
      type: Number,
      default: false
    },
    royalties: {
      type: Number,
      default: false
    },
    slug: String,
    duration: {
      type: String,
      default: false,
    },
    maxGroupSize: {
      type: Number,
      default: false,
    },
    difficulty: {
      type: String,
      required: false,
      enum: {
        values: ["easy", "medium", "difficulty"],
        message: "Difficulty is either: easy, medium and difficulty",
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, "rating must have 1"],
      max: [5, "rating must have 5"]
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    rating: {
      type: Number,
      default: 4.5,
    },
    price: {
      type: Number,
      required: [true, "A NFT must have price"],
    },
      priceDiscount: {
      //THIS CAN ONLY WORK AT THE TIME OF CREATE not update
      type: Number,
      validate: {
        validator: function (val) {
          return val < this.price; // 200 > 100  20 < 100
        },
        message: "Discount price ({VALUE}) should be below regular price",
      }      
    },
    summary: {
      type: String,
      trim: true,
      default: false,
    },
    description: {
      type: String,
      required: [true, "must provide the description"],
      trim: true,
    },
    imageCover: {
      type: String,
      default: false,
    },
    image: [String],
    startDates: {
      type: Date,
      default: Date.now(),
      select: false
    },
    // startDates: [Date],
    secretNfts: {
      type: Boolean,
      default: false,
    },
    website: {
      type: String,
      default: false,
    },
    royalties: {
      type: String,
      default: false,
    },
    fileSize: {
      type: String,
      default: false,
    },
    category: {
      type: String,
      default: false,
    },
    collectionName: {
      type: String,
      default: false,
    },
    properties: {
      type: String,
      default: false,
    },
  },  
  {
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  }
  
);

nftSchema.virtual("durationWeeks").get(function () {
  return this.duration / 7;
});

//MONGOOSE MIDDLEWARE

//DOCUMNT MIDDLEWARE: runs before .save() or .create()
nftSchema.pre("save", function (next) {
  console.log(this);
  this.slug = slugify(this.name, { lower: true });
  next();
});

// nftSchema.pre("save", function (next) {
//   console.log("document will save....");
//   next();
// });

// nftSchema.post("save", function (doc, next) {
//   console.log(doc);
//   next();
// });

//QYERY MIDDLEWARE

//---------pre
// nftSchema.pre("find", function (next) {
  nftSchema.pre(/^find/, function (next) {
    this.find({ secretNfts: { $ne: true } });
    this.start = Date.now();
    next();
  });
  
  // nftSchema.pre("findOne", function (next) {
  //   this.find({ secretNfts: { $ne: true } });
  //   next();
  // });

  //-----post
nftSchema.post(/^find/, function (doc, next) {
  console.log(`Query took time: ${Date.now() - this.start} times`);
  // console.log(doc);
  next();
});

//AGGREATION MIDDLEWARE
nftSchema.pre("aggregate", function (next) {
  this.pipeline().unshift({ $match: { secretNfts: { $ne: true } } });
  // console.log(this.pipeline());
  next();
});
const NFT = mongoose.model("NFT", nftSchema);

module.exports = NFT;
