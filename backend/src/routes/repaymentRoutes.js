import { Router } from "express";
import { createRepayment } from "../controllers/repaymentController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../utils/http.js";

const router = Router();

router.post("/add", requireAuth, asyncHandler(createRepayment));

export default router;
