import { Router } from "express";
import { login, register } from "../controllers/authController.js";
import { asyncHandler } from "../utils/http.js";

const router = Router();

router.post("/register", asyncHandler(register));
router.post("/login", asyncHandler(login));

export default router;
