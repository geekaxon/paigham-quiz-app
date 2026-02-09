import { Router, Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { authMiddleware } from "../../middlewares/auth.middleware";

const uploadDir = path.join(__dirname, "../../../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"));
    }
  },
});

const router = Router();

router.post("/pdf", authMiddleware, (req: Request, res: Response) => {
  upload.single("file")(req, res, (err) => {
    if (err) {
      const message = err instanceof multer.MulterError
        ? err.code === "LIMIT_FILE_SIZE" ? "File too large (max 10MB)" : err.message
        : err.message || "Upload failed";
      res.status(400).json({ success: false, data: null, message });
      return;
    }

    if (!req.file) {
      res.status(400).json({ success: false, data: null, message: "No file uploaded" });
      return;
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ success: true, data: { url: fileUrl }, message: "File uploaded successfully" });
  });
});

export default router;
