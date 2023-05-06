const express = require("express");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require('hpp');
const cors = require("cors");
const socketio = require("socket.io");
const http = require("http");

const AppError = require("./Utils/appError");
const globalErrorHsndler = require("./controllers/errorController");
const nftsRouter = require("./routes/nftsRoute");
const usersRouter = require("./routes/usersRoute");
const collectionRouter = require("./routes/Collection")
//const getCollectionRouter = require("./routes/Collection")
const nftController = require("./controllers/nftControllers");
const app = express();
app.use(express.json({ limit: "5mb" }));
//app.use(cors({origin: 'https://thedaygalpuclub.netlify.app'}));

// DATA SANITIZATION against NoSQL query injection
app.use(mongoSanitize());

// DATA SANITIZATION against site script XSS
app.use(xss());

// PREVENT PARAMETER POPULATION
app.use(
  hpp({ 
    whitelist: [
      "duration", 
      "difficulty", 
      "price", 
      "maxGroupSize", 
      "ratingsAverage", 
      "ratingsQuantity",
    ], 
  })
);
// SECURE HEADER HTTP
app.use(helmet());

//RATE LIMIT
// const apiLimiter = rateLimit({
//   windowMs: 60 * 60 * 1000, // 15 minutes
//   max: 100, // limit each IP to 100 requests per windowMs
//   message: "Too many requests, please try again later"
// });

// apply to specific routes
// app.use("/api", apiLimiter);

// if (process.env.NODE_ENV === "development ") {
//   app.use(morgan("dev"));
// }

app.use(morgan("dev"));

//SERVING TEMPLATE DEMO
app.use(express.static('public'))
//index.js
app.get('/', (req, res) => {
  res.sendFile('index.html', {root: path.join(__dirname, 'public')});
})
app.use(express.static(`${__dirname}/nft-data/img`));

//CUSTOM MIDDLE WARE
app.use((req, res, next) => {
  console.log("Hey i am from middleware function 👋");
  next();
});
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  res.setHeader('Access-Control-Allow-Origin', 'https://thedaygalpuclub.netlify.app, https://thedaygalpuclub.com ');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // console.log(req.headers);
  next();
});

app.use("/api/v1/nfts", nftsRouter);
app.use("/api/v1/users", usersRouter);
app.use("/api/v1/collection", collectionRouter);

//ERROR SECTION

app.all("*", (req, res, next) => {
  // res.status(404).json({
  //   status: "fail",
  //   message: `Can't find ${req.originalUrl} on this server`,
  // // });
  // const err = new Error(`Can't find ${req.originalUrl} on this server`)
  // err.status = "fail";
  // err.statusCode = 404;
  // next(err);

  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});
app.use((req, res, next) => {
  res.on('header', () => {
    console.log('Content-Type:', res.get('Content-Type'))
  })
  next()
})

// then add the aliasTopNFTs middleware
app.get('/api/v1/nfts/top-5-nfts', nftController.aliasTopNFTs, nftController.getAllNfts)

//GLOBAL ERROR HANDLEING

app.use(globalErrorHsndler);

module.exports = app;