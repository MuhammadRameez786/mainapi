const express = require("express");
const nftControllers = require("./../controllers/nftControllers");
const authController = require("./../controllers/authController");
// const {
//   getAllNfts,
//   createNFT,
//   getSingleNFT,
//   updateNFT,
//   deleteNFT,
// } = require("./../controllers/nftControllers");

const router = express.Router();
// router.param("id", nftControllers.checkId);

//ROUTER NFTs
router
  .route("/")
  .get(nftControllers.getAllNfts)
  .post(nftControllers.createNFT);

//TOP 5 NFTs BY PRICE
router.route("/top-5-nfts").get(nftControllers.aliasTopNFTs);

// //STATS ROUTE
router.route("/nfts-stats").get(nftControllers.getNFTsStats);
router.route("/top-5-creators").get(nftControllers.getTop5Creators);

// //GET MONTHLY PLAN
router.route("/monthly-plan/:year").get(nftControllers.getMonthlyPlan);



router
  .route("/:id")
  .get(nftControllers.getSingleNFT)
  .patch(nftControllers.updateNFT)
  .delete(authController.protect, 
  authController.restrictTo("admin", "giuide"), 
  nftControllers.deleteNFT);

module.exports = router;