import { Router } from "express";
import {
  addExpense,
  deleteExpense,
  listPersonalExpenses,
  listRecentExpenses,
  listSharedExpenses,
  updateExpense,
} from "../controllers/expenseController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../utils/http.js";

const router = Router();

router.post("/add", requireAuth, asyncHandler(addExpense));
router.get("/personal", requireAuth, asyncHandler(listPersonalExpenses));
router.get("/shared", requireAuth, asyncHandler(listSharedExpenses));
router.get("/recent", requireAuth, asyncHandler(listRecentExpenses));
router.put("/personal/:id", requireAuth, asyncHandler(updateExpense));
router.delete("/personal/:id", requireAuth, asyncHandler(deleteExpense));

export default router;
