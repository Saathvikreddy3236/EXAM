import jwt from "jsonwebtoken";

const expiresIn = "7d";

export function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
}

export function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}
