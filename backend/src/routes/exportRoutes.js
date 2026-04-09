import { Router } from "express";
import { exportCsv } from "../controllers/exportController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../utils/http.js";

const router = Router();

router.get("/csv", requireAuth, asyncHandler(exportCsv));

export default router;
