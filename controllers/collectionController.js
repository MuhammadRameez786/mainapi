const NFTCollection = require("./../models/nftCollection");
const APIFeatures = require("./../Utils/apiFeatures");
const catchAsync = require("../Utils/catchAsync");
const AppError = require("../Utils/appError");
const sse = require("sse");

//POST METHOD
exports.createNFTCollection = catchAsync(async (req, res) => {
    const newCollection = await NFTCollection.create(req.body);
    res.status(201).json({
        status: "Collection Created successfully",
        data: {
          nft: newCollection,
        },
      });
});



  
  
//GET METHOD 
// exports.getAllCollection = catchAsync( async (req, res) => {

//     req.sseClients = [];
   
//     res.writeHead(200, {
//       "Content-Type": "text/event-stream;charset=utf-8",
//       "Cache-Control": "no-cache",
//       "Connection": "keep-alive"
//     });
//     res.flushHeaders();
  
//     res.write("event: ping\ndata: \n\n");
  
//     req.on("close", () => {
//       console.log("SSE client disconnected");
//       req.sseClients = req.sseClients.filter((client) => client !== res);
//       res.end();
//     });
  
//     req.sseClients.push(res);
//     try {
//       const features = new APIFeatures(NFTCollection.find(), req.query)
     
//       const nftCollection = await features.query;
  
//       req.sseClients.forEach((client) => {
//         client.write(`event: update\ndata: ${JSON.stringify(nftCollection)}\n\n`);
//       });
//       //console.log("Results", nfts); 
//     } catch (err) {
//       console.error(err);
//       res.status(500).send('Internal Server Error');
//     }
//     } 
// );

// GET SINGLE COLLECTION
exports.getSingleNFTCollection = catchAsync(async (req, res) => {
    req.sseClients = [];
 
  res.writeHead(200, {
    "Content-Type": "text/event-stream;charset=utf-8",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
  });
  res.flushHeaders();

  res.write("event: ping\ndata: \n\n");

  req.on("close", () => {
    console.log("SSE client disconnected");
    req.sseClients = req.sseClients.filter((client) => client !== res);
    res.end();
  });

  req.sseClients.push(res);
  try {
    const nft = await NFTCollection.findById(req.params.id);
  
    req.sseClients.forEach((client) => {
        client.write(`event: update\ndata: ${JSON.stringify(nft)}\n\n`);
      });
      //console.log("Results", nfts); 
    } catch (err) {
      console.error(err);
      res.status(500).send('Internal Server Error');
    }
});

//UPDATE COLLECTION
exports.updateNFTCollection = catchAsync(async (req, res) => {
    req.sseClients = [];
 
  res.writeHead(200, {
    "Content-Type": "text/event-stream;charset=utf-8",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive"
  });
  res.flushHeaders();

  res.write("event: ping\ndata: \n\n");

  req.on("close", () => {
    console.log("SSE client disconnected");
    req.sseClients = req.sseClients.filter((client) => client !== res);
    res.end();
  });

  req.sseClients.push(res);
  try {
    const nft = await NFTCollection.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
  
    req.sseClients.forEach((client) => {
        client.write(`event: update\ndata: ${JSON.stringify(nft)}\n\n`);
      });
      //console.log("Results", nfts); 
    } catch (err) {
      console.error(err);
      res.status(500).send('Internal Server Error');
    }
});

//DELETE COLLECTION
exports.deleteNFTCollection = catchAsync(async (req, res) => {

    await NFTCollection.findByIdAndDelete(req.params.id);
    res.status(204).json({
      status: "success",
      data: null,
    });
});