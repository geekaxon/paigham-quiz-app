import { Router, Request, Response } from "express";
import { getMemberDetails } from "./member.service";

const router = Router();

router.get("/:omjCard", async (req: Request<{ omjCard: string }>, res: Response) => {
  const member = await getMemberDetails(req.params.omjCard);

  if (!member) {
    res.status(404).json({ success: false, data: null, message: "Member not found" });
    return;
  }

  res.json({ success: true, data: member, message: "Member retrieved successfully" });
});

export default router;
