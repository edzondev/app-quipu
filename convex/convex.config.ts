import { defineApp } from "convex/server";
import betterAuth from "./betterAuth/convex.config";
import polar from "@convex-dev/polar/convex.config";

const app = defineApp();

app.use(betterAuth);
app.use(polar);

export default app;
