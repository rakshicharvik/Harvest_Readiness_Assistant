import type { RouteConfig } from "@react-router/dev/routes";
import { route } from "@react-router/dev/routes";

export default [
  route("/", "routes/login.tsx"),
  route("/assistant", "routes/assistant.tsx"),
] satisfies RouteConfig;
