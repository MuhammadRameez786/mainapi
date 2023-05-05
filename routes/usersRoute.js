const express = require("express");
const userControllers = require("./../controllers/userControllers");
const authController = require("./../controllers/authController");
const loginController = require("./../controllers/loginController");
//const { protect } = require('./../controllers/authController');
//const { updateUser } = require('./../controllers/userControllers');

const router = express.Router();

router.post("/signup", authController.signup);
router.post("/login", loginController.login);

router.post("/forgotPassword", authController.forgotPassword);
router.patch("/resetPassword/:token", authController.resetPassword);

router.patch("/updateMyPassword", authController.protect, authController.updatePassword);
router.patch("/updateMe", authController.protect, userControllers.updateMe);
router.delete("/deleteme", authController.protect, userControllers.deleteMe);
router.post("/newsletter", authController.newsletter);
router.put("/follow", authController.protect, authController.follow);
router.put("/unfollow", authController.protect, authController.unfollow);

router
  .route("/")
  .get(userControllers.getAllUsers)
  .post(userControllers.createUser);

//router.route("/profile").post(protect, updateUser);
router
  .route("/:id")
  .get(userControllers.getSingleUser)
  .patch(userControllers.updateUser)
  .delete(userControllers.deleteUser)

  router.get("/:id/verify/:token", authController.verifyEmail);

  
module.exports = router;