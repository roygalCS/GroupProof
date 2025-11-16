const express = require('express');
const router = express.Router();
const { sendInviteEmail, generateInviteToken, verifyInviteToken } = require('../utils/email');
const { storeInvite, getInvite, getInvitesByTask, devStoreMember, devHasMember, devStoreSubmission } = require('../utils/storage');

/**
 * POST /api/invite
 * Send invitation emails to task members
 */
router.post('/invite', async (req, res) => {
  try {
    const { taskId, emails, taskTitle, stakeAmount, joinWindowTimestamp, creatorEmail } = req.body;

    if (!taskId || !emails || !Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'taskId and emails array are required'
      });
    }

    const inviteResults = [];

    console.log(`\n📧 Processing ${emails.length} email invitation(s)...`);
    console.log(`   Task ID: ${taskId}`);
    console.log(`   Emails: ${emails.join(', ')}`);
    
    for (const email of emails) {
      try {
        console.log(`\n   Processing invite for: ${email}`);
        
        // Generate unique invite token
        const inviteToken = generateInviteToken({
          taskId,
          email,
          expiresIn: '7d'
        });

        // Store invite in memory (in production, use a database)
        storeInvite(inviteToken, {
          taskId,
          email,
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        });

        // Generate invite link
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const inviteLink = `${frontendUrl}/join/${inviteToken}`;
        console.log(`   Invite link: ${inviteLink}`);

        // Send email
        console.log(`   Sending email via SendGrid...`);
        const emailResult = await sendInviteEmail({
          to: email,
          taskTitle: taskTitle || 'Group Task',
          stakeAmount: stakeAmount || 'TBD',
          inviteLink,
          creatorEmail: creatorEmail || 'A team member'
        });

        if (emailResult.success) {
          inviteResults.push({
            email,
            success: true,
            inviteToken
          });
        } else {
          console.error(`Failed to send email to ${email}:`, emailResult.error);
          inviteResults.push({
            email,
            success: false,
            error: emailResult.error || 'Unknown error',
            details: emailResult.details
          });
        }
      } catch (error) {
        console.error(`Failed to send invite to ${email}:`, error);
        inviteResults.push({
          email,
          success: false,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: 'Invitations processed',
      results: inviteResults
    });

  } catch (error) {
    console.error('Error in /invite:', error);
    res.status(500).json({
      error: 'Failed to send invitations',
      message: error.message
    });
  }
});

/**
 * GET /api/verify-invite/:token
 * Verify an invite token and return task info
 */
router.get('/verify-invite/:token', (req, res) => {
  try {
    const { token } = req.params;

    // Verify JWT token
    const decoded = verifyInviteToken(token);

    if (!decoded) {
      return res.status(400).json({
        error: 'Invalid or expired invite token'
      });
    }

    // Get invite from storage
    const invite = getInvite(token);

    if (!invite) {
      return res.status(404).json({
        error: 'Invite not found or expired'
      });
    }

    res.json({
      success: true,
      taskId: invite.taskId,
      email: invite.email,
      createdAt: invite.createdAt,
      expiresAt: invite.expiresAt
    });

  } catch (error) {
    console.error('Error in /verify-invite:', error);
    res.status(500).json({
      error: 'Failed to verify invite',
      message: error.message
    });
  }
});

/**
 * POST /api/resend-invite
 * Resend an invitation email
 */
router.post('/resend-invite', async (req, res) => {
  try {
    const { taskId, email, taskTitle, stakeAmount, creatorEmail } = req.body;

    if (!taskId || !email) {
      return res.status(400).json({
        error: 'taskId and email are required'
      });
    }

    // Generate new invite token
    const inviteToken = generateInviteToken({
      taskId,
      email,
      expiresIn: '7d'
    });

    // Store invite
    storeInvite(inviteToken, {
      taskId,
      email,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    });

    // Generate invite link
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const inviteLink = `${frontendUrl}/join/${inviteToken}`;

    // Send email
    await sendInviteEmail({
      to: email,
      taskTitle: taskTitle || 'Group Task',
      stakeAmount: stakeAmount || 'TBD',
      inviteLink,
      creatorEmail: creatorEmail || 'A team member'
    });

    res.json({
      success: true,
      message: 'Invitation resent successfully'
    });

  } catch (error) {
    console.error('Error in /resend-invite:', error);
    res.status(500).json({
      error: 'Failed to resend invitation',
      message: error.message
    });
  }
});

// Dev-mode endpoints (only intended for local testing)
router.post('/dev/join', (req, res) => {
  try {
    const { taskId, wallet, email } = req.body;
    if (!taskId || !wallet) {
      return res.status(400).json({ error: 'taskId and wallet are required' });
    }

    // Ensure invite exists for task
    const invites = getInvitesByTask(taskId);
    if (!invites || invites.length === 0) {
      return res.status(400).json({ error: 'No invites found for this task (dev-mode requires invites)' });
    }

    // Store dev member (not on-chain)
    devStoreMember(taskId, wallet, { email: email || null, joinedAt: new Date().toISOString(), paid: false });

    res.json({ success: true, message: 'Dev join registered', member: { taskId, wallet } });
  } catch (err) {
    console.error('Error in /dev/join:', err);
    res.status(500).json({ error: 'Dev join failed', message: err.message });
  }
});

router.post('/dev/submit-proof', (req, res) => {
  try {
    const { taskId, wallet, cid } = req.body;
    if (!taskId || !wallet || !cid) {
      return res.status(400).json({ error: 'taskId, wallet and cid are required' });
    }

    if (!devHasMember(taskId, wallet)) {
      return res.status(403).json({ error: 'Wallet is not a member of this task (dev-mode)' });
    }

    devStoreSubmission(taskId, { wallet, cid, createdAt: new Date().toISOString() });

    res.json({ success: true, message: 'Dev submission recorded' });
  } catch (err) {
    console.error('Error in /dev/submit-proof:', err);
    res.status(500).json({ error: 'Dev submit failed', message: err.message });
  }
});

module.exports = router;
