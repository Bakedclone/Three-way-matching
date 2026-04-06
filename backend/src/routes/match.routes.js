import express from "express";
import { getMatch } from "../controllers/match.controller.js";

const router = express.Router();

router.get("/:poNumber", getMatch);

export default router;
