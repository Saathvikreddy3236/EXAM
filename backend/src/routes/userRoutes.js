import { Router } from "express";
import { getProfile, updateProfile } from "../controllers/userController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../utils/http.js";

const router = Router();

router.get("/profile", requireAuth, asyncHandler(getProfile));
router.put("/profile", requireAuth, asyncHandler(updateProfile));

export default router;
