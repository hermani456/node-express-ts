import { Request, Response, NextFunction } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../utils/auth.js";
import { logger } from "../utils/logger.js";

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Attach user/session to locals for controllers to use
    res.locals.user = session.user;
    res.locals.session = session.session;

    next();
  } catch (error) {
    logger.error(error, "Error in auth middleware");
    res.status(500).json({ error: "Internal server error" });
  }
};
