import { ApiError } from "../utils/http.js";
import {
  createExpense,
  deletePersonalExpense,
  getPersonalExpenses,
  getRecentTransactions,
  getSharedExpenseLists,
  updatePersonalExpense,
} from "../models/expenseModel.js";
import { areFriends } from "../models/friendModel.js";
import { findUserByUsername } from "../models/userModel.js";

function normalizeParticipants(currentUsername, amount, splitType, participants = []) {
  if (!Array.isArray(participants) || participants.length === 0) {
    throw new ApiError(400, "Shared expense participants are required.");
  }

  const seen = new Set();
  for (const participant of participants) {
    if (!participant.username) {
      throw new ApiError(400, "Each participant must have a username.");
    }
    if (participant.username === currentUsername) {
      throw new ApiError(400, "Do not include yourself in shared participants.");
    }
    if (seen.has(participant.username)) {
      throw new ApiError(400, "Duplicate shared expense participants are not allowed.");
    }
    seen.add(participant.username);
  }

  if (splitType === "custom") {
    const normalized = participants.map((participant) => ({
      username: participant.username,
      amount: Number(participant.amount),
    }));

    const customTotal = normalized.reduce((sum, participant) => sum + participant.amount, 0);
    if (normalized.some((participant) => !participant.amount || participant.amount <= 0)) {
      throw new ApiError(400, "Custom split amounts must be greater than zero.");
    }
    if (customTotal > Number(amount)) {
      throw new ApiError(400, "Custom split total cannot exceed payment amount.");
    }

    return normalized;
  }

  // CRITICAL FIX: Correct equal split - divide by number of participants (not +1)
  // If payer covers $300 for 3 friends, each friend owes $100, not $75
  const share = Number((Number(amount) / participants.length).toFixed(2));
  return participants.map((participant) => ({
    username: participant.username,
    amount: share,
  }));
}

async function validateParticipants(currentUsername, participants) {
  for (const participant of participants) {
    const user = await findUserByUsername(participant.username);
    if (!user) {
      throw new ApiError(404, `User ${participant.username} not found.`);
    }

    if (!(await areFriends(currentUsername, participant.username))) {
      throw new ApiError(400, `${participant.username} is not in your friends list.`);
    }
  }
}

export async function addExpense(req, res) {
  const {
    title,
    amount,
    catId,
    date,
    modeId,
    note = "",
    isShared = false,
    splitType = "equal",
    participants = [],
  } = req.body;

  if (!title || !amount || !catId || !date || !modeId) {
    throw new ApiError(400, "title, amount, catId, date, and modeId are required.");
  }

  if (String(note).length > 200) {
    throw new ApiError(400, "Expense note cannot exceed 200 characters.");
  }

  let normalizedParticipants = [];
  if (isShared) {
    // HIGH FIX: Validate that shared expense has at least one participant
    if (!participants || participants.length === 0) {
      throw new ApiError(400, "Shared expense requires at least one participant.");
    }
    normalizedParticipants = normalizeParticipants(
      req.user.username,
      amount,
      splitType,
      participants
    );
    await validateParticipants(req.user.username, normalizedParticipants);
  }

  const expense = await createExpense({
    username: req.user.username,
    title,
    amount,
    catId,
    date,
    modeId,
    note,
    isShared,
    splitType,
    participants: normalizedParticipants,
  });

  res.status(201).json(expense);
}

export async function listPersonalExpenses(req, res) {
  res.json(await getPersonalExpenses(req.user.username, req.query));
}

export async function listSharedExpenses(req, res) {
  res.json(await getSharedExpenseLists(req.user.username));
}

export async function listRecentExpenses(req, res) {
  res.json(await getRecentTransactions(req.user.username));
}

export async function updateExpense(req, res) {
  const updated = await updatePersonalExpense(
    req.user.username,
    req.params.id,
    req.body
  );

  if (!updated) {
    throw new ApiError(404, "Personal expense not found.");
  }

  res.json(updated);
}

export async function deleteExpense(req, res) {
  const deleted = await deletePersonalExpense(req.user.username, req.params.id);

  if (!deleted) {
    throw new ApiError(404, "Personal expense not found.");
  }

  res.status(204).send();
}
