const NFTCollection = require("../models/nftCollection");
const APIFeatures = require("../Utils/apiFeatures");
const catchAsync = require("../Utils/catchAsync");
const AppError = require("../Utils/appError");
const SSE = require('express-sse');
const sse = new SSE();

exports.getAllCollection = catchAsync(async (req, res) => {
    const query = NFTCollection.find();
    const features = new APIFeatures(query, req.query);
    const nftCollection = await features.query;
  
    // Separate collections based on category
    const arts = [];
    const music = [];
    const photography = [];
  
    nftCollection.forEach((collection) => {
      if (collection.category === 'Arts') {
        arts.push(collection);
      } else if (collection.category === 'Music') {
        music.push(collection);
      } else if (collection.category === 'Photography') {
        photography.push(collection);
      }
    });
  
    // SEND SSE STREAM
    res.writeHead(200, {
      "Content-Type": "text/event-stream;charset=utf-8",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    });
  
    res.write(`event: nftCollection\n`);
    res.write(`data: ${JSON.stringify({ arts, music, photography })}\n\n`);
  
    // Keep the connection open by sending a comment every 15 seconds
    const intervalId = setInterval(() => {
      res.write(`: ping\n\n`);
    }, 15000);
  
    // Clean up the interval when the client closes the connection
    req.on('close', () => {
      clearInterval(intervalId);
    });
  });
  
// exports.getAllCollection = catchAsync(async (req, res) => {
//     const query = NFTCollection.find();
//     const features = new APIFeatures(query, req.query);
//     const nftCollection = await features.query;
  
//     // Separate collections based on category
//     const arts = [];
//     const music = [];
//     const photography = [];
  
//     nftCollection.forEach((collection) => {
//       if (collection.category === 'Arts') {
//         arts.push(collection);
//       } else if (collection.category === 'Music') {
//         music.push(collection);
//       } else if (collection.category === 'Photography') {
//         photography.push(collection);
//       }
//     });
  
//     // SEND RESPONSE
//     res.status(200).json({
//       status: 'success',
//       data: {
//         arts,
//         music,
//         photography,
//       },
//     });
//   });
  

// stack": "TypeError: res.flush is not a function\n    at SSE.dataListener (C:\\Users\\Rameez\\Desktop\\MyNFTProject\\Api-starter-file-main - Part2 Auth\\node_modules\\express-sse\\index.js:70:11)\n    at SSE.emit (node:events:513:28)\n    at SSE.send (C:\\Users\\Rameez\\Desktop\\MyNFTProject\\Api-starter-file-main - Part2 Auth\\node_modules\\express-sse\\index.js:124:10)\n    
// at C:\\Users\\Rameez\\Desktop\\MyNFTProject\\Api-starter-file-main - Part2 Auth\\controllers\\getAllController.js:29:7\n    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)"