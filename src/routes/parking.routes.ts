import { Router } from "express";
import {
  searchSpots,
  createSpot,
  bookSpot,
} from "../controllers/parking.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.use(requireAuth);

router.get("/search", searchSpots);
router.post("/spots", createSpot);
router.post("/book", bookSpot);

export const parkingRouter = router;
