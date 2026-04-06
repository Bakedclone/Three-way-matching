import express from "express";
import documentRoutes from "./routes/document.routes.js";
import matchRoutes from "./routes/match.routes.js";

const app = express();

app.use(express.json());

app.use("/documents", documentRoutes);
app.use("/match", matchRoutes);

export default app;
