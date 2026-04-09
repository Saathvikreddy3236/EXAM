import { Router } from "express";
import {
  acceptFriendRequest,
  addFriend,
  listFriends,
  listRequests,
  rejectFriendRequest,
} from "../controllers/friendController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../utils/http.js";

const router = Router();

router.post("/add", requireAuth, asyncHandler(addFriend));
router.get("/list", requireAuth, asyncHandler(listFriends));
router.get("/requests", requireAuth, asyncHandler(listRequests));
router.post("/accept", requireAuth, asyncHandler(acceptFriendRequest));
router.post("/reject", requireAuth, asyncHandler(rejectFriendRequest));

export default router;
