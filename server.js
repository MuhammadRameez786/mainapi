// const dotenv = require("dotenv");
// const mongoose = require("mongoose");
// const app = require("./app");

// dotenv.config({ path: "./config.env" });
// const DB = process.env.DATABASE.replace(
//   "<PASSWORD>",
//   process.env.DATABASE_PASSWORD
// );

// mongoose
//   .connect(DB, {
//     useCreateIndex: true,
//     useFindAndModify: false,
//     useNewUrlParser: true,
//   })
//   .then((con) => {
//     // console.log(con.connection);
//     console.log("DB Connection Successfully");
//   });

// console.log(process.env.NODE_ENV);
// //console.log(app.get("env"));
// //console.log(process.env)

// // const nftSchema = new mongoose.Schema({
// //   name: {
// //     type: String,
// //     required: [true, "A NFT must have a name"],
// //     unique: true,
// //   },
// //   rating: {
// //     type: Number,
// //     default: 4.5,
// //   },
// //   price: {
// //     type: Number,
// //     required: [true, "A NFT must have price"],
// //   },
// // });



// // const testNFT = new NFT({
// //   name: "The rameez Monkey",
// //   rating: 3.2,
// //   price: 567,
// // });

// // testNFT
// //   .save()
// //   .then((docNFT) => {
// //     console.log(docNFT);
// //   })
// //   .catch((error) => {
// //     console.log("ERROR:", error);
// //   });



// const port = process.env.PORT || 3000;
// app.listen(port, () => {
//   console.log(`App running on port ${port}....`);
// });

//PART 2----------------------

const dotenv = require("dotenv");
const mongoose = require("mongoose");
const app = require("./app");


process.on("uncaughtException", err=>{
  console.log("uncaughtException Shutting down Application");
  console.log(err.name, err.message);
  process.exit(1);
});

dotenv.config({ path: "./config.env" });
const DB = "mongodb+srv://rameez:Nopwd40001@cluster0.ogku096.mongodb.net/NFTMarketplace?retryWrites=true&w=majority"

mongoose
  .connect(DB, {
    useCreateIndex: true,
    useFindAndModify: false,
    useNewUrlParser: true,
    useUnifiedTopology: false,
  })
  .then((con) => {
    console.log("DB Connection Successfully");
  }) 
  // .catch((err) => console.log("ERROR"));

console.log(process.env.NODE_ENV);
app.get('/', (req, res) => {
  res.send('Hello, world!');
});

const port = process.env.PORT || 4000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}....`);
});

process.on("unhandledRejection", (err) => {
  console.log("unhandledRejection Shutting down Application");
  console.log(err.name, err.message); 
  server.close(() => {
    process.exit(1);
  });
});



//console.log(d);