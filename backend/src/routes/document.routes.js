import express from "express";
import multer from "multer";
import {
  uploadDocument,
  getDocument
} from "../controllers/document.controller.js";

const router = express.Router();
const upload = multer();

router.post("/upload", upload.single("file"), uploadDocument);
router.get("/:id", getDocument);

export default router;
