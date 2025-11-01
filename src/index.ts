import express, { Request, Response } from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { auth } from "#src/utils/auth.js";

const app = express();
const port = process.env.PORT ?? 3001;

app.use(
  cors({
    origin: process.env.CORS_ORIGIN ?? "http://localhost:8000", // Replace with your frontend's origin
    methods: ["GET", "POST", "PUT", "DELETE"], // Specify allowed HTTP methods
    credentials: true, // Allow credentials (cookies, authorization headers, etc.)
  }),
);

app.all("/api/auth/{*any}", toNodeHandler(auth));

app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Better Auth app listening on http://localhost:${String(port)}`);
});
