const express = require("express");
const collectionController = require("./../controllers/collectionController");
const authController = require("./../controllers/authController");
const  getAllController  = require("../controllers/getAllController");


const router = express.Router();

//ROUTER NFTs

router
.route("/")
.post(collectionController.createNFTCollection)
.get(getAllController.getAllCollection);  

// //TOP 5 NFTs BY PRICE
// router.route("/top-5-nfts").get(nftControllers.aliasTopNFTs);

// // //STATS ROUTE
// router.route("/nfts-stats").get(nftControllers.getNFTsStats);
// router.route("/top-5-creators").get(nftControllers.getTop5Creators);

// // //GET MONTHLY PLAN
// router.route("/monthly-plan/:year").get(nftControllers.getMonthlyPlan);



router
  .route("/:id")
  .get(collectionController.getSingleNFTCollection)
  .patch(collectionController.updateNFTCollection)
  .delete(collectionController.deleteNFTCollection);

module.exports = router;