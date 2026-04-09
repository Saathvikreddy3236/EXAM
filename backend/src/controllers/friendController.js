import { ApiError } from "../utils/http.js";
import {
  areFriends,
  createFriendRequest,
  findPendingRequest,
  getFriends,
  getIncomingRequests,
  respondToFriendRequest,
} from "../models/friendModel.js";
import { findUserByUsername } from "../models/userModel.js";

export async function addFriend(req, res) {
  const { username } = req.body;

  if (!username) {
    throw new ApiError(400, "Friend username is required.");
  }

  if (username === req.user.username) {
    throw new ApiError(400, "You cannot add yourself.");
  }

  const targetUser = await findUserByUsername(username);
  if (!targetUser) {
    throw new ApiError(404, "Target user not found.");
  }

  if (await areFriends(req.user.username, username)) {
    throw new ApiError(409, "You are already friends.");
  }

  const outgoing = await findPendingRequest(req.user.username, username);
  if (outgoing) {
    throw new ApiError(409, "Friend request already sent.");
  }

  const incoming = await findPendingRequest(username, req.user.username);
  if (incoming) {
    throw new ApiError(409, "This user has already sent you a request.");
  }

  const request = await createFriendRequest(req.user.username, username);
  res.status(201).json(request);
}

export async function listFriends(req, res) {
  res.json(await getFriends(req.user.username));
}

export async function listRequests(req, res) {
  res.json(await getIncomingRequests(req.user.username));
}

export async function acceptFriendRequest(req, res) {
  const { requestId } = req.body;
  if (!requestId) {
    throw new ApiError(400, "requestId is required.");
  }

  const request = await respondToFriendRequest(
    requestId,
    req.user.username,
    "accepted"
  );

  if (!request) {
    throw new ApiError(404, "Friend request not found.");
  }

  res.json(request);
}

export async function rejectFriendRequest(req, res) {
  const { requestId } = req.body;
  if (!requestId) {
    throw new ApiError(400, "requestId is required.");
  }

  const request = await respondToFriendRequest(
    requestId,
    req.user.username,
    "rejected"
  );

  if (!request) {
    throw new ApiError(404, "Friend request not found.");
  }

  res.json(request);
}
