import { Router, Request, Response } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import Paigham from "./paigham.model";

const router = Router();

router.get("/", async (_req: Request, res: Response) => {
  const paighams = await Paigham.find({ isArchived: false }).sort({ publicationDate: -1 });
  res.json({ success: true, data: paighams, message: "Paighams retrieved successfully" });
});

router.get("/:id", async (req: Request, res: Response) => {
  const paigham = await Paigham.findById(req.params.id);

  if (!paigham) {
    res.status(404).json({ success: false, data: null, message: "Paigham not found" });
    return;
  }

  res.json({ success: true, data: paigham, message: "Paigham retrieved successfully" });
});

router.post("/", authMiddleware, async (req: Request, res: Response) => {
  const paigham = await Paigham.create(req.body);
  res.status(201).json({ success: true, data: paigham, message: "Paigham created successfully" });
});

router.put("/:id", authMiddleware, async (req: Request, res: Response) => {
  const paigham = await Paigham.findByIdAndUpdate(req.params.id, req.body, { new: true });

  if (!paigham) {
    res.status(404).json({ success: false, data: null, message: "Paigham not found" });
    return;
  }

  res.json({ success: true, data: paigham, message: "Paigham updated successfully" });
});

router.delete("/:id", authMiddleware, async (req: Request, res: Response) => {
  const paigham = await Paigham.findByIdAndDelete(req.params.id);

  if (!paigham) {
    res.status(404).json({ success: false, data: null, message: "Paigham not found" });
    return;
  }

  res.json({ success: true, data: null, message: "Paigham deleted successfully" });
});

export default router;
