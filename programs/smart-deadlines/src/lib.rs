use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod smart_deadlines {
    use super::*;

    /// Creates a new group task with escrow for accountability
    pub fn create_task(
        ctx: Context<CreateTask>,
        stake_per_member: u64,
        required_members: u8,
        join_window_timestamp: i64,
        deadline_timestamp: i64,
        charity_pubkey: Pubkey,
        description_cid: String,
        task_id: String,
    ) -> Result<()> {
        require!(required_members > 0, ErrorCode::InvalidMemberCount);
        require!(stake_per_member > 0, ErrorCode::InvalidStakeAmount);
        require!(join_window_timestamp > Clock::get()?.unix_timestamp, ErrorCode::InvalidJoinWindow);
        require!(deadline_timestamp > join_window_timestamp, ErrorCode::InvalidDeadline);
        require!(description_cid.len() <= 100, ErrorCode::CidTooLong);
        require!(task_id.len() <= 50, ErrorCode::TaskIdTooLong);

        let task = &mut ctx.accounts.task;
        task.creator = ctx.accounts.creator.key();
        task.stake_per_member = stake_per_member;
        task.required_members = required_members;
        task.member_count = 0;
        task.join_window_timestamp = join_window_timestamp;
        task.deadline_timestamp = deadline_timestamp;
        task.charity_pubkey = charity_pubkey;
        task.description_cid = description_cid;
        task.yes_votes = 0;
        task.no_votes = 0;
        task.finalized = false;
        task.total_deposited = 0;
        task.task_id = task_id;
        task.bump = ctx.bumps.task;
        task.escrow_bump = ctx.bumps.escrow_account;

        msg!("Task created successfully");
        Ok(())
    }

    /// Allows a member to join the task and deposit their stake
    pub fn join_and_deposit(
        ctx: Context<JoinAndDeposit>,
        email_hash: String,
    ) -> Result<()> {
        let task = &mut ctx.accounts.task;

        // Verify join window is still open
        require!(Clock::get()?.unix_timestamp <= task.join_window_timestamp, ErrorCode::JoinWindowClosed);

        // Verify task is not full
        require!(task.member_count < task.required_members, ErrorCode::TaskFull);

        // Verify email hash length
        require!(email_hash.len() <= 100, ErrorCode::EmailHashTooLong);

        // Initialize member account
        let member = &mut ctx.accounts.member;
        member.owner = ctx.accounts.member_signer.key();
        member.task = task.key();
        member.email_hash = email_hash;
        member.proof_cid = String::new();
        member.voted = false;
        member.vote_yes = false;
        member.deposited = false;
        member.bump = ctx.bumps.member;

        // Transfer SPL-USDC from member to escrow
        let cpi_accounts = Transfer {
            from: ctx.accounts.member_token_account.to_account_info(),
            to: ctx.accounts.escrow_account.to_account_info(),
            authority: ctx.accounts.member_signer.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, task.stake_per_member)?;

        // Update state
        member.deposited = true;
        task.member_count += 1;
        task.total_deposited += task.stake_per_member;

        msg!("Member joined and deposited {} tokens", task.stake_per_member);
        Ok(())
    }

    /// Allows task creator to submit proof of completion (IPFS CID)
    pub fn submit_proof(
        ctx: Context<SubmitProof>,
        proof_cid: String,
    ) -> Result<()> {
        require!(proof_cid.len() <= 100, ErrorCode::CidTooLong);

        let task = &ctx.accounts.task;
        let member = &mut ctx.accounts.member;

        // Verify the member is the task creator
        require!(member.owner == task.creator, ErrorCode::OnlyCreatorCanSubmitProof);

        // Store proof CID
        member.proof_cid = proof_cid;

        msg!("Proof submitted successfully");
        Ok(())
    }

    /// Allows members to vote on task completion after deadline
    pub fn vote(
        ctx: Context<Vote>,
        vote_yes: bool,
    ) -> Result<()> {
        let task = &mut ctx.accounts.task;
        let member = &mut ctx.accounts.member;

        // Verify deadline has passed
        require!(Clock::get()?.unix_timestamp > task.deadline_timestamp, ErrorCode::DeadlineNotReached);

        // Verify member hasn't voted yet
        require!(!member.voted, ErrorCode::AlreadyVoted);

        // Verify member deposited
        require!(member.deposited, ErrorCode::MemberNotDeposited);

        // Record vote
        member.voted = true;
        member.vote_yes = vote_yes;

        if vote_yes {
            task.yes_votes += 1;
        } else {
            task.no_votes += 1;
        }

        msg!("Vote recorded: {}", if vote_yes { "YES" } else { "NO" });
        Ok(())
    }

    /// Finalizes the task and distributes funds based on voting outcome
    pub fn finalize(ctx: Context<Finalize>) -> Result<()> {
        let task = &mut ctx.accounts.task;

        // Verify task not already finalized
        require!(!task.finalized, ErrorCode::AlreadyFinalized);

        // Verify deadline has passed
        require!(Clock::get()?.unix_timestamp > task.deadline_timestamp, ErrorCode::DeadlineNotReached);

        // Verify all members have voted
        require!(
            task.yes_votes + task.no_votes == task.member_count,
            ErrorCode::NotAllMembersVoted
        );

        let total_votes = task.yes_votes + task.no_votes;
        let majority_threshold = (total_votes + 1) / 2; // Strict majority

        // Determine outcome: if yes_votes > majority_threshold, refund; otherwise donate
        // For even cases with tie (e.g., 2-2), yes_votes will NOT be > 2, so money goes to charity
        let refund_members = task.yes_votes > majority_threshold;

        if refund_members {
            // Refund all members - this requires calling this instruction multiple times
            // or having all member accounts passed in. For simplicity, we'll use a single
            // member refund approach and require multiple finalize calls.
            // However, for production, we'll do a single transfer to the provided recipient.

            // Since we need to refund multiple members, this is a simplified version
            // In production, you'd either:
            // 1. Pass all member token accounts and refund in one call
            // 2. Have a separate claim_refund instruction
            // For this implementation, we'll use approach #2 in a separate instruction

            // Mark as finalized with refund outcome
            task.finalized = true;
            msg!("Task finalized: REFUND mode - members can claim their stakes");
        } else {
            // Send entire escrow to charity
            let task_id = task.task_id.clone();
            let seeds = &[
                b"task",
                task_id.as_bytes(),
                &[task.bump],
            ];
            let signer = &[&seeds[..]];

            let cpi_accounts = Transfer {
                from: ctx.accounts.escrow_account.to_account_info(),
                to: ctx.accounts.charity_token_account.to_account_info(),
                authority: ctx.accounts.task.to_account_info(),
            };
            let cpi_program = ctx.accounts.token_program.to_account_info();
            let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
            token::transfer(cpi_ctx, task.total_deposited)?;

            task.finalized = true;
            msg!("Task finalized: Donated {} tokens to charity", task.total_deposited);
        }

        Ok(())
    }

    /// Allows members to claim refund if task was successful
    pub fn claim_refund(ctx: Context<ClaimRefund>) -> Result<()> {
        let task = &ctx.accounts.task;
        let member = &mut ctx.accounts.member;

        // Verify task is finalized
        require!(task.finalized, ErrorCode::NotFinalized);

        // Verify member deposited
        require!(member.deposited, ErrorCode::MemberNotDeposited);

        // Verify member voted
        require!(member.voted, ErrorCode::MemberNotVoted);

        // Verify majority voted yes (refund scenario)
        let total_votes = task.yes_votes + task.no_votes;
        let majority_threshold = (total_votes + 1) / 2;
        require!(task.yes_votes > majority_threshold, ErrorCode::NoRefundAvailable);

        // Transfer stake back to member
        let task_id = task.task_id.clone();
        let seeds = &[
            b"task",
            task_id.as_bytes(),
            &[task.bump],
        ];
        let signer = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.escrow_account.to_account_info(),
            to: ctx.accounts.member_token_account.to_account_info(),
            authority: ctx.accounts.task.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        token::transfer(cpi_ctx, task.stake_per_member)?;

        // Mark member as claimed (reuse deposited flag to prevent double claim)
        member.deposited = false;

        msg!("Refund claimed: {} tokens", task.stake_per_member);
        Ok(())
    }
}

// ========== CONTEXTS ==========

#[derive(Accounts)]
#[instruction(stake_per_member: u64, required_members: u8, join_window_timestamp: i64, deadline_timestamp: i64, charity_pubkey: Pubkey, description_cid: String, task_id: String)]
pub struct CreateTask<'info> {
    #[account(
        init,
        payer = creator,
        space = 8 + Task::INIT_SPACE,
        seeds = [b"task", task_id.as_bytes()],
        bump
    )]
    pub task: Account<'info, Task>,

    #[account(
        init,
        payer = creator,
        seeds = [b"escrow", task.key().as_ref()],
        bump,
        token::mint = usdc_mint,
        token::authority = task,
    )]
    pub escrow_account: Account<'info, TokenAccount>,

    /// CHECK: USDC mint address
    pub usdc_mint: AccountInfo<'info>,

    #[account(mut)]
    pub creator: Signer<'info>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
#[instruction(email_hash: String)]
pub struct JoinAndDeposit<'info> {
    #[account(mut)]
    pub task: Account<'info, Task>,

    #[account(
        init,
        payer = member_signer,
        space = 8 + Member::INIT_SPACE,
        seeds = [b"member", task.key().as_ref(), member_signer.key().as_ref()],
        bump
    )]
    pub member: Account<'info, Member>,

    #[account(mut)]
    pub member_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [b"escrow", task.key().as_ref()],
        bump = task.escrow_bump,
    )]
    pub escrow_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub member_signer: Signer<'info>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct SubmitProof<'info> {
    pub task: Account<'info, Task>,

    #[account(
        mut,
        seeds = [b"member", task.key().as_ref(), member_signer.key().as_ref()],
        bump = member.bump,
    )]
    pub member: Account<'info, Member>,

    pub member_signer: Signer<'info>,
}

#[derive(Accounts)]
pub struct Vote<'info> {
    #[account(mut)]
    pub task: Account<'info, Task>,

    #[account(
        mut,
        seeds = [b"member", task.key().as_ref(), voter.key().as_ref()],
        bump = member.bump,
    )]
    pub member: Account<'info, Member>,

    pub voter: Signer<'info>,
}

#[derive(Accounts)]
pub struct Finalize<'info> {
    #[account(
        mut,
        seeds = [b"task", task.task_id.as_bytes()],
        bump = task.bump,
    )]
    pub task: Account<'info, Task>,

    #[account(
        mut,
        seeds = [b"escrow", task.key().as_ref()],
        bump = task.escrow_bump,
    )]
    pub escrow_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub charity_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct ClaimRefund<'info> {
    #[account(
        seeds = [b"task", task.task_id.as_bytes()],
        bump = task.bump,
    )]
    pub task: Account<'info, Task>,

    #[account(
        mut,
        seeds = [b"member", task.key().as_ref(), member_signer.key().as_ref()],
        bump = member.bump,
    )]
    pub member: Account<'info, Member>,

    #[account(
        mut,
        seeds = [b"escrow", task.key().as_ref()],
        bump = task.escrow_bump,
    )]
    pub escrow_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub member_token_account: Account<'info, TokenAccount>,

    pub member_signer: Signer<'info>,

    pub token_program: Program<'info, Token>,
}

// ========== ACCOUNTS ==========

#[account]
#[derive(InitSpace)]
pub struct Task {
    pub creator: Pubkey,                    // 32
    pub stake_per_member: u64,              // 8
    pub required_members: u8,               // 1
    pub member_count: u8,                   // 1
    pub join_window_timestamp: i64,         // 8
    pub deadline_timestamp: i64,            // 8
    pub charity_pubkey: Pubkey,             // 32
    #[max_len(100)]
    pub description_cid: String,            // 4 + 100
    pub yes_votes: u8,                      // 1
    pub no_votes: u8,                       // 1
    pub finalized: bool,                    // 1
    pub total_deposited: u64,               // 8
    #[max_len(50)]
    pub task_id: String,                    // 4 + 50
    pub bump: u8,                           // 1
    pub escrow_bump: u8,                    // 1
}

#[account]
#[derive(InitSpace)]
pub struct Member {
    pub owner: Pubkey,                      // 32
    pub task: Pubkey,                       // 32
    #[max_len(100)]
    pub email_hash: String,                 // 4 + 100
    #[max_len(100)]
    pub proof_cid: String,                  // 4 + 100
    pub voted: bool,                        // 1
    pub vote_yes: bool,                     // 1
    pub deposited: bool,                    // 1
    pub bump: u8,                           // 1
}

// ========== ERRORS ==========

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid member count")]
    InvalidMemberCount,
    #[msg("Invalid stake amount")]
    InvalidStakeAmount,
    #[msg("Invalid join window timestamp")]
    InvalidJoinWindow,
    #[msg("Invalid deadline timestamp")]
    InvalidDeadline,
    #[msg("CID string too long")]
    CidTooLong,
    #[msg("Task ID too long")]
    TaskIdTooLong,
    #[msg("Join window has closed")]
    JoinWindowClosed,
    #[msg("Task is already full")]
    TaskFull,
    #[msg("Email hash too long")]
    EmailHashTooLong,
    #[msg("Only task creator can submit proof")]
    OnlyCreatorCanSubmitProof,
    #[msg("Deadline has not been reached yet")]
    DeadlineNotReached,
    #[msg("Member has already voted")]
    AlreadyVoted,
    #[msg("Member has not deposited")]
    MemberNotDeposited,
    #[msg("Task already finalized")]
    AlreadyFinalized,
    #[msg("Not all members have voted")]
    NotAllMembersVoted,
    #[msg("Task not finalized yet")]
    NotFinalized,
    #[msg("Member has not voted")]
    MemberNotVoted,
    #[msg("No refund available - task failed")]
    NoRefundAvailable,
}
