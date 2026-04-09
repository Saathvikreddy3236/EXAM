import { verifyToken } from "../utils/jwt.js";

export function requireAuth(req, res, next) {
  const authorization = req.headers.authorization || "";
  const [scheme, token] = authorization.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ message: "Authentication required." });
  }

  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch (_error) {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
}
