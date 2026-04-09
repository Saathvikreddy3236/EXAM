import { query, withTransaction } from "../db.js";

function normalizePair(a, b) {
  return [a, b].sort();
}

export async function areFriends(usernameA, usernameB) {
  const [u1, u2] = normalizePair(usernameA, usernameB);
  const result = await query(
    'SELECT 1 FROM "FRIENDS" WHERE u1_username = $1 AND u2_username = $2',
    [u1, u2]
  );
  return result.rowCount > 0;
}

export async function findPendingRequest(senderUsername, receiverUsername) {
  const result = await query(
    `SELECT * FROM "FRIEND_REQUEST"
     WHERE sender_username = $1 AND receiver_username = $2 AND status = 'pending'`,
    [senderUsername, receiverUsername]
  );
  return result.rows[0] || null;
}

export async function createFriendRequest(senderUsername, receiverUsername) {
  const result = await query(
    `INSERT INTO "FRIEND_REQUEST" (sender_username, receiver_username)
     VALUES ($1, $2)
     RETURNING id, sender_username, receiver_username, status, created_at`,
    [senderUsername, receiverUsername]
  );

  return result.rows[0];
}

export async function getFriends(username) {
  const result = await query(
    `SELECT
        CASE
          WHEN f.u1_username = $1 THEN u2.username
          ELSE u1.username
        END AS username,
        CASE
          WHEN f.u1_username = $1 THEN u2.fullname
          ELSE u1.fullname
        END AS fullname,
        CASE
          WHEN f.u1_username = $1 THEN u2.email
          ELSE u1.email
        END AS email
      FROM "FRIENDS" f
      JOIN "USER" u1 ON u1.username = f.u1_username
      JOIN "USER" u2 ON u2.username = f.u2_username
      WHERE f.u1_username = $1 OR f.u2_username = $1
      ORDER BY fullname ASC`,
    [username]
  );

  return result.rows;
}

export async function getIncomingRequests(username) {
  const result = await query(
    `SELECT
        fr.id,
        fr.sender_username,
        u.fullname,
        u.email,
        fr.created_at
      FROM "FRIEND_REQUEST" fr
      JOIN "USER" u ON u.username = fr.sender_username
      WHERE fr.receiver_username = $1 AND fr.status = 'pending'
      ORDER BY fr.created_at DESC`,
    [username]
  );

  return result.rows;
}

export async function respondToFriendRequest(requestId, receiverUsername, action) {
  return withTransaction(async (client) => {
    const requestResult = await client.query(
      `SELECT * FROM "FRIEND_REQUEST"
       WHERE id = $1 AND receiver_username = $2 AND status = 'pending'`,
      [requestId, receiverUsername]
    );

    const request = requestResult.rows[0];
    if (!request) {
      return null;
    }

    await client.query(
      `UPDATE "FRIEND_REQUEST" SET status = $2 WHERE id = $1`,
      [requestId, action]
    );

    if (action === "accepted") {
      const [u1, u2] = normalizePair(
        request.sender_username,
        request.receiver_username
      );

      await client.query(
        `INSERT INTO "FRIENDS" (u1_username, u2_username)
         VALUES ($1, $2)
         ON CONFLICT (u1_username, u2_username) DO NOTHING`,
        [u1, u2]
      );
    }

    return {
      ...request,
      status: action,
    };
  });
}
