import { Router } from "express";
import authRoutes from "./auth.routes.js";
import { authenticate } from "../authorization/authorization.js";

const router = Router();

router.use("/", authRoutes);

router.get("/lists", authenticate, (_req, res) => {
  res.send([]);
});

export default router;
