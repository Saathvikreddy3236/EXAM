import { ApiError } from "../utils/http.js";
import { findUserByEmail, findUserByUsername, updateUserProfile } from "../models/userModel.js";

export async function getProfile(req, res) {
  const user = await findUserByUsername(req.user.username);

  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  res.json({
    username: user.username,
    email: user.email,
    fullname: user.fullname,
    currency_preferred: user.currency_preferred,
  });
}

export async function updateProfile(req, res) {
  const { email, fullname, currencyPreferred } = req.body;

  if (!email || !fullname || !currencyPreferred) {
    throw new ApiError(400, "email, fullname, and currencyPreferred are required.");
  }

  const existingEmail = await findUserByEmail(email);
  if (existingEmail && existingEmail.username !== req.user.username) {
    throw new ApiError(409, "Email already exists.");
  }

  const user = await updateUserProfile(req.user.username, {
    email,
    fullname,
    currencyPreferred,
  });

  res.json(user);
}
