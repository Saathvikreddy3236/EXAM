import { Router } from "express";
import {
  getDashboard,
  listCategories,
  listPaymentModes,
} from "../controllers/metaController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../utils/http.js";

const router = Router();

router.get("/categories", requireAuth, asyncHandler(listCategories));
router.get("/payment-modes", requireAuth, asyncHandler(listPaymentModes));
router.get("/dashboard", requireAuth, asyncHandler(getDashboard));

export default router;
