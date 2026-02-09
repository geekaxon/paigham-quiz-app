import { Router } from "express";
import { loginAdmin } from "./admin.controller";

const router = Router();

router.post("/login", loginAdmin);

export default router;
