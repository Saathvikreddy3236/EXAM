import { ApiError } from "../utils/http.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { signToken } from "../utils/jwt.js";
import {
  createUser,
  findUserByEmail,
  findUserByUsername,
} from "../models/userModel.js";

function buildAuthResponse(user) {
  const token = signToken({ username: user.username, email: user.email });

  return {
    token,
    user,
  };
}

export async function register(req, res) {
  const { username, email, fullname, currencyPreferred = "USD", password } = req.body;

  if (!username || !email || !fullname || !password) {
    throw new ApiError(400, "username, email, fullname, and password are required.");
  }

  const existingUsername = await findUserByUsername(username);
  if (existingUsername) {
    throw new ApiError(409, "Username already exists.");
  }

  const existingEmail = await findUserByEmail(email);
  if (existingEmail) {
    throw new ApiError(409, "Email already exists.");
  }

  const user = await createUser({
    username,
    email,
    fullname,
    currencyPreferred,
    passwordHash: hashPassword(password),
  });

  res.status(201).json(buildAuthResponse(user));
}

export async function login(req, res) {
  const { usernameOrEmail, password } = req.body;

  if (!usernameOrEmail || !password) {
    throw new ApiError(400, "usernameOrEmail and password are required.");
  }

  const user =
    (await findUserByUsername(usernameOrEmail)) ||
    (await findUserByEmail(usernameOrEmail));

  if (!user || !verifyPassword(password, user.password_hash)) {
    throw new ApiError(401, "Invalid credentials.");
  }

  res.json(
    buildAuthResponse({
      username: user.username,
      email: user.email,
      fullname: user.fullname,
      currency_preferred: user.currency_preferred,
    })
  );
}
