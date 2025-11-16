/**
 * In-memory storage for invite tokens
 *
 * IMPORTANT: In production, replace this with a proper database
 * like PostgreSQL, MongoDB, or Redis
 */

const inviteStore = new Map();

/**
 * Store an invite token
 */
function storeInvite(token, inviteData) {
  inviteStore.set(token, inviteData);

  // Auto-cleanup after expiration (7 days)
  setTimeout(() => {
    inviteStore.delete(token);
  }, 7 * 24 * 60 * 60 * 1000);
}

/**
 * Retrieve an invite by token
 */
function getInvite(token) {
  return inviteStore.get(token);
}

/**
 * Delete an invite
 */
function deleteInvite(token) {
  return inviteStore.delete(token);
}

/**
 * Get all invites for a task (admin function)
 */
function getInvitesByTask(taskId) {
  const invites = [];
  for (const [token, data] of inviteStore.entries()) {
    if (data.taskId === taskId) {
      invites.push({ token, ...data });
    }
  }
  return invites;
}

/**
 * Clean up expired invites
 */
function cleanupExpiredInvites() {
  const now = new Date();
  for (const [token, data] of inviteStore.entries()) {
    if (new Date(data.expiresAt) < now) {
      inviteStore.delete(token);
    }
  }
}

// Run cleanup every hour
setInterval(cleanupExpiredInvites, 60 * 60 * 1000);

// Dev-mode in-memory member & submission stores
const devMembers = new Map(); // taskId -> Map(wallet -> memberData)
const devSubmissions = new Map(); // taskId -> Array of submission objects

function devStoreMember(taskId, wallet, data) {
  if (!devMembers.has(taskId)) devMembers.set(taskId, new Map());
  devMembers.get(taskId).set(wallet, { wallet, ...data });
}

function devGetMembers(taskId) {
  if (!devMembers.has(taskId)) return [];
  return Array.from(devMembers.get(taskId).values());
}

function devHasMember(taskId, wallet) {
  return devMembers.has(taskId) && devMembers.get(taskId).has(wallet);
}

function devStoreSubmission(taskId, submission) {
  if (!devSubmissions.has(taskId)) devSubmissions.set(taskId, []);
  devSubmissions.get(taskId).push(submission);
}

function devGetSubmissions(taskId) {
  return devSubmissions.get(taskId) || [];
}

module.exports = {
  storeInvite,
  getInvite,
  deleteInvite,
  getInvitesByTask,
  cleanupExpiredInvites,
  // dev helpers
  devStoreMember,
  devGetMembers,
  devHasMember,
  devStoreSubmission,
  devGetSubmissions,
};

