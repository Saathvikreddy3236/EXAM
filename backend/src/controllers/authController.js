import { ApiError } from "../utils/http.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { signToken } from "../utils/jwt.js";
import {
  createUser,
  findUserByEmail,
  findUserByUsername,
} from "../models/userModel.js";

const USERNAME_REGEX = /^[A-Za-z0-9]{5,15}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}$/;
const ALLOWED_CURRENCIES = new Set(["INR", "USD", "EUR", "GBP"]);

function buildAuthResponse(user) {
  const token = signToken({ username: user.username, email: user.email });

  return {
    token,
    user,
  };
}

export async function register(req, res) {
  const {
    username,
    email,
    fullname,
    currencyPreferred,
    password,
    confirmPassword,
  } = req.body;

  if (!username || !email || !fullname || !password || !confirmPassword) {
    throw new ApiError(400, "fullname, email, username, password, confirmPassword, and currencyPreferred are required.");
  }

  const normalizedUsername = String(username).trim();
  const normalizedEmail = String(email).trim().toLowerCase();
  const normalizedFullname = String(fullname).trim();

  if (!USERNAME_REGEX.test(normalizedUsername)) {
    throw new ApiError(400, "Username must be 5-15 characters, alphanumeric only, with no spaces or special characters.");
  }

  if (!EMAIL_REGEX.test(normalizedEmail)) {
    throw new ApiError(400, "Enter a valid email address.");
  }

  if (!PASSWORD_REGEX.test(password)) {
    throw new ApiError(400, "Password must be at least 8 characters and include at least 1 uppercase letter and 1 special character.");
  }

  if (password !== confirmPassword) {
    throw new ApiError(400, "Password and confirm password must match.");
  }

  if (!ALLOWED_CURRENCIES.has(currencyPreferred)) {
    throw new ApiError(400, "Currency preference must be one of INR, USD, EUR, or GBP.");
  }

  const existingUsername = await findUserByUsername(normalizedUsername);
  if (existingUsername) {
    throw new ApiError(409, "Username already exists.");
  }

  const existingEmail = await findUserByEmail(normalizedEmail);
  if (existingEmail) {
    throw new ApiError(409, "Email already exists.");
  }

  const user = await createUser({
    username: normalizedUsername,
    email: normalizedEmail,
    fullname: normalizedFullname,
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

  const loginValue = String(usernameOrEmail).trim();
  const user =
    (await findUserByUsername(loginValue)) ||
    (await findUserByEmail(loginValue.toLowerCase()));

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
