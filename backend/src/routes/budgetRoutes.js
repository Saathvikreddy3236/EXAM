import { Router } from "express";
import { addBudget, getAllBudgets, updateBudget } from "../controllers/budgetController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../utils/http.js";

const router = Router();

router.post("/add", requireAuth, asyncHandler(addBudget));
router.get("/all", requireAuth, asyncHandler(getAllBudgets));
router.put("/update", requireAuth, asyncHandler(updateBudget));

export default router;
