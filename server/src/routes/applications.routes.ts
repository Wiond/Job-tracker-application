import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { requireAuth } from "../middleware/requireAuth";
import {
  listApplications,
  getApplication,
  createApplication,
  updateApplication,
  deleteApplication,
} from "../controllers/applications.controller";

const router = Router();

router.use(requireAuth);

router.get("/", asyncHandler(listApplications));
router.get("/:id", asyncHandler(getApplication));
router.post("/", asyncHandler(createApplication));
router.patch("/:id", asyncHandler(updateApplication));
router.delete("/:id", asyncHandler(deleteApplication));

export default router;
