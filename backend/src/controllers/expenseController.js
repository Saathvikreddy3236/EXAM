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

function hasMoreThanTwoDecimals(value) {
  return !Number.isInteger(Number(value) * 100);
}

function getTodayString() {
  return new Date().toLocaleDateString("en-CA");
}

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

  // Equal split includes the payer as one of the participants.
  // Example: $500 split between creator + 1 friend => each share is $250.
  // The creator's share is treated as already paid, so only the other users get owed entries.
  const totalPeopleInSplit = participants.length + 1;
  const share = Number((Number(amount) / totalPeopleInSplit).toFixed(2));
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

  if (String(title).trim().length > 80) {
    throw new ApiError(400, "Expense title cannot exceed 80 characters.");
  }

  if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
    throw new ApiError(400, "Expense amount must be greater than zero.");
  }

  if (hasMoreThanTwoDecimals(amount)) {
    throw new ApiError(400, "Expense amount can have at most 2 decimal places.");
  }

  if (date > getTodayString()) {
    throw new ApiError(400, "Expense date cannot be in the future.");
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
