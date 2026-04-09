import { Router } from "express";
import {
  getOwedExpenses,
  getReceivableExpenses,
} from "../controllers/sharedExpenseController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../utils/http.js";

const router = Router();

router.get("/owed", requireAuth, asyncHandler(getOwedExpenses));
router.get("/receivable", requireAuth, asyncHandler(getReceivableExpenses));

export default router;
