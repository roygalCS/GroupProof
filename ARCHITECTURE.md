# SmartDeadlines Architecture

This document provides a detailed technical overview of the SmartDeadlines system architecture.

---

## System Overview

SmartDeadlines is a three-tier decentralized application:

1. **Frontend (React/Vite)** - User interface
2. **Backend (Node/Express)** - Email service
3. **Blockchain (Solana/Anchor)** - Core business logic and escrow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        User's Browser                                │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │            React Frontend (app/)                              │  │
│  │  - Wallet Adapter (Phantom, etc.)                            │  │
│  │  - Task Creation & Management UI                             │  │
│  │  - IPFS Upload (Web3.Storage)                                │  │
│  │  - Program Interaction (via @coral-xyz/anchor)               │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                           │                     │
                           │ HTTP                │ RPC
                           ▼                     ▼
        ┌──────────────────────────┐   ┌────────────────────────┐
        │   Backend (backend/)     │   │   Solana Devnet/       │
        │  - Express API           │   │   Testnet              │
        │  - SendGrid Email        │   │  ┌──────────────────┐  │
        │  - JWT Invite Tokens     │   │  │ Smart Deadlines  │  │
        │  - In-memory Storage     │   │  │ Program (Anchor) │  │
        └──────────────────────────┘   │  └──────────────────┘  │
                                        │  - Task PDAs         │  │
                                        │  - Member PDAs       │  │
                                        │  - Escrow PDAs       │  │
                                        └────────────────────────┘
                                                   │
                                                   │ Token Transfers
                                                   ▼
                                        ┌────────────────────────┐
                                        │   SPL Token Program    │
                                        │  - USDC Escrow         │
                                        │  - CPI Transfers       │
                                        └────────────────────────┘
```

---

## Blockchain Layer (Anchor Program)

### Account Structure

#### Task Account
```rust
pub struct Task {
    pub creator: Pubkey,              // Who created the task
    pub stake_per_member: u64,        // USDC amount each member deposits
    pub required_members: u8,         // Total members needed
    pub member_count: u8,             // Current members joined
    pub join_window_timestamp: i64,   // Deadline to join
    pub deadline_timestamp: i64,      // Task completion deadline
    pub charity_pubkey: Pubkey,       // Where to send funds if task fails
    pub description_cid: String,      // IPFS CID of task description
    pub yes_votes: u8,                // Count of YES votes
    pub no_votes: u8,                 // Count of NO votes
    pub finalized: bool,              // Has outcome been executed
    pub total_deposited: u64,         // Total USDC in escrow
    pub task_id: String,              // Unique identifier
    pub bump: u8,                     // PDA bump
    pub escrow_bump: u8,              // Escrow PDA bump
}
```

#### Member Account
```rust
pub struct Member {
    pub owner: Pubkey,          // Member's wallet
    pub task: Pubkey,           // Associated task
    pub email_hash: String,     // Hashed email for invite verification
    pub proof_cid: String,      // IPFS CID of submitted proof
    pub voted: bool,            // Has this member voted
    pub vote_yes: bool,         // Their vote (YES/NO)
    pub deposited: bool,        // Has deposited stake
    pub bump: u8,               // PDA bump
}
```

### PDA Derivation

1. **Task PDA**
   ```
   seeds = [b"task", task_id.as_bytes()]
   ```

2. **Escrow PDA** (Token Account owned by Task PDA)
   ```
   seeds = [b"escrow", task_pubkey.as_ref()]
   authority = Task PDA
   ```

3. **Member PDA**
   ```
   seeds = [b"member", task_pubkey.as_ref(), member_pubkey.as_ref()]
   ```

### Instruction Flow

#### 1. Create Task
```
Creator → Program.createTask()
  ├─ Validates inputs (stake > 0, deadlines valid)
  ├─ Creates Task PDA
  ├─ Creates Escrow Token Account (PDA-owned)
  └─ Stores task metadata
```

#### 2. Join and Deposit
```
Member → Program.joinAndDeposit()
  ├─ Validates join window is open
  ├─ Creates Member PDA
  ├─ Transfers USDC: Member → Escrow (CPI)
  ├─ Increments member_count
  └─ Updates total_deposited
```

#### 3. Submit Proof
```
Creator → Program.submitProof()
  ├─ Validates caller is task creator
  ├─ Stores IPFS CID in Member PDA
  └─ Event emitted
```

#### 4. Vote
```
Member → Program.vote()
  ├─ Validates deadline has passed
  ├─ Validates member hasn't voted
  ├─ Records vote in Member PDA
  └─ Increments yes_votes or no_votes
```

#### 5. Finalize
```
Anyone → Program.finalize()
  ├─ Validates all members voted
  ├─ Calculates majority
  ├─ IF majority YES:
  │    └─ Marks for refund (members claim individually)
  └─ IF majority NO or TIE:
       └─ Transfers entire escrow to charity (CPI)
```

#### 6. Claim Refund
```
Member → Program.claimRefund()
  ├─ Validates task finalized
  ├─ Validates majority voted YES
  ├─ Transfers stake: Escrow → Member (CPI)
  └─ Prevents double-claim
```

### Security Considerations

- **PDA as Authority**: Escrow account owned by Task PDA prevents unauthorized withdrawals
- **CPI with Signer Seeds**: Program signs token transfers using PDA seeds
- **State Validation**: All transitions check preconditions (timestamps, vote counts)
- **Double-Claim Prevention**: `deposited` flag reused to track claims
- **No Reentrancy**: Anchor's account constraints prevent reentrancy attacks

---

## Frontend Layer (React/Vite)

### Component Hierarchy

```
App
├── HomePage
├── CreateTaskPage
│   ├── Form Validation
│   ├── IPFS Upload (description)
│   ├── Transaction Signing
│   └── Backend API Call (send invites)
├── JoinTaskPage
│   ├── Invite Verification
│   ├── Task Details Display
│   └── Deposit Transaction
├── TaskDashboardPage
│   ├── Task Status Display
│   ├── Member List
│   ├── Countdown Timers
│   └── Action Buttons
├── SubmitProofPage
│   ├── File Upload
│   ├── IPFS Upload
│   └── On-chain Submission
├── VotePage
│   ├── Proof Viewer (IPFS)
│   ├── Vote Buttons
│   └── Transaction Signing
└── FinalizePage
    ├── Vote Results
    ├── Finalize Transaction
    └── Claim Refund Transaction
```

### State Management

**Wallet Context** (via Solana Wallet Adapter):
- Connected wallet
- Public key
- Sign transaction function

**Program Context** (Custom Hook):
```typescript
useProgram() → Returns Anchor program instance
useTask(taskId) → Fetches and subscribes to task state
useCountdown(timestamp) → Real-time countdown
```

### IPFS Integration

```typescript
// Upload Flow
File → uploadToIPFS(file) → Web3.Storage API → CID
CID → Store on-chain → Retrieve via getIPFSUrl(cid)
```

**Storage Options**:
1. Web3.Storage (recommended)
2. Pinata
3. NFT.Storage
4. Self-hosted IPFS node

### Transaction Flow

```typescript
// Example: Joining a task
const joinTask = async () => {
  // 1. Derive PDAs
  const taskPDA = await getTaskPDA(taskId);
  const memberPDA = await getMemberPDA(taskPDA, wallet.publicKey);
  const escrowPDA = await getEscrowPDA(taskPDA);

  // 2. Get member's token account
  const memberTokenAccount = await getAssociatedTokenAddress(
    USDC_MINT,
    wallet.publicKey
  );

  // 3. Call program
  const tx = await program.methods
    .joinAndDeposit(emailHash)
    .accounts({
      task: taskPDA,
      member: memberPDA,
      memberTokenAccount,
      escrowAccount: escrowPDA,
      memberSigner: wallet.publicKey,
      // ...system programs
    })
    .rpc();

  // 4. Confirm transaction
  await connection.confirmTransaction(tx);
};
```

---

## Backend Layer (Node/Express)

### API Endpoints

#### POST `/api/invite`
Sends email invitations to task members.

**Request:**
```json
{
  "taskId": "task-123456",
  "emails": ["alice@example.com", "bob@example.com"],
  "taskTitle": "Final Year Project",
  "stakeAmount": 10,
  "joinWindowTimestamp": 1234567890,
  "creatorEmail": "creator@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "results": [
    { "email": "alice@example.com", "success": true, "inviteToken": "jwt..." },
    { "email": "bob@example.com", "success": true, "inviteToken": "jwt..." }
  ]
}
```

**Process:**
1. Validate inputs
2. For each email:
   - Generate JWT invite token
   - Store in memory (or DB)
   - Send email via SendGrid
3. Return results

#### GET `/api/verify-invite/:token`
Verifies an invite token and returns task info.

**Response:**
```json
{
  "success": true,
  "taskId": "task-123456",
  "email": "alice@example.com",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "expiresAt": "2024-01-08T00:00:00.000Z"
}
```

### JWT Token Structure

```json
{
  "taskId": "task-123456",
  "email": "alice@example.com",
  "type": "invite",
  "iat": 1234567890,
  "exp": 1234567890
}
```

Signed with `JWT_SECRET` from `.env`.

### Email Template

HTML email includes:
- Task title and details
- Stake amount
- Clickable invite link
- Expiration notice
- Step-by-step instructions

**Invite Link Format:**
```
https://app.smartdeadlines.com/join/{JWT_TOKEN}
```

### Storage (In-Memory)

```javascript
// Temporary storage for invites
const inviteStore = new Map();

inviteStore.set(token, {
  taskId,
  email,
  createdAt: Date,
  expiresAt: Date
});
```

**Production Note**: Replace with PostgreSQL, MongoDB, or Redis.

---

## Data Flow Examples

### Example 1: Creating a Task

```
1. User fills form in CreateTaskPage
2. Frontend uploads description to IPFS → Gets CID
3. Frontend calls program.createTask(params, CID)
4. Program creates Task PDA + Escrow PDA
5. Frontend calls backend /api/invite
6. Backend generates JWT tokens
7. Backend sends emails via SendGrid
8. Members receive email with invite link
```

### Example 2: Voting on a Task

```
1. Member opens VotePage
2. Frontend fetches task and proof CID from program
3. User views proof via IPFS link
4. User clicks "Vote YES" or "Vote NO"
5. Frontend calls program.vote(voteYes)
6. Program validates:
   - Deadline passed
   - Member hasn't voted
   - Member deposited stake
7. Program records vote, increments counter
8. Transaction confirms, UI updates
```

### Example 3: Finalization (Majority NO)

```
1. All members have voted
2. Anyone calls program.finalize()
3. Program counts votes:
   - YES: 1
   - NO: 3
   - Majority: NO
4. Program performs CPI transfer:
   - From: Escrow PDA
   - To: Charity Token Account
   - Amount: total_deposited
   - Authority: Task PDA (signer seeds)
5. Program marks finalized = true
6. Frontend shows "Funds donated to charity"
```

---

## Network Architecture

### Devnet Deployment
- **RPC**: `https://api.devnet.solana.com`
- **Program**: Deployed via `anchor deploy`
- **USDC**: Test mint created via `spl-token create-token`
- **Wallets**: Funded via `solana airdrop`

### Testnet Deployment (If Gemini Wallet Supports)
- **RPC**: `https://api.testnet.solana.com`
- Same deployment process
- Better for production-like testing

### Localnet Testing
- **Validator**: `solana-test-validator`
- **RPC**: `http://localhost:8899`
- Fast iteration, full control
- Reset state easily

---

## Performance Considerations

### Frontend
- **Lazy Loading**: Code-split by route
- **Caching**: Cache IPFS content
- **Debouncing**: Limit RPC calls on user input

### Backend
- **Rate Limiting**: Prevent email spam
- **Queue System**: For bulk email sends
- **Database**: Use connection pooling

### Blockchain
- **Batch Transactions**: Combine when possible
- **Compute Budget**: Increase for complex operations
- **Account Size**: Minimize to reduce rent

---

## Scalability

### Current Limitations
- In-memory invite storage (not persistent)
- No pagination for task lists
- Single RPC endpoint (no failover)

### Future Improvements
1. **Database**: PostgreSQL for invite/task metadata
2. **Caching**: Redis for frequently accessed data
3. **CDN**: Serve frontend via CDN
4. **Multi-RPC**: Load balance across providers
5. **Indexer**: Use program indexer for fast queries
6. **Websockets**: Real-time updates

---

## Security Best Practices

### Blockchain
- ✅ PDA-owned escrow accounts
- ✅ CPI with signer seeds
- ✅ State validation on all instructions
- ✅ Anchor's built-in protections

### Backend
- ✅ JWT token expiration (7 days)
- ✅ Input validation
- ✅ CORS configuration
- ⚠️  Use HTTPS in production
- ⚠️  Implement rate limiting

### Frontend
- ✅ Wallet adapter security
- ✅ Environment variables for secrets
- ⚠️  Validate all user inputs
- ⚠️  Sanitize IPFS content display

---

## Monitoring & Logging

### Recommended Tools
- **Blockchain**: Solana Explorer, Solscan
- **Backend**: Winston, Morgan
- **Frontend**: Sentry
- **Uptime**: UptimeRobot, Pingdom

### Key Metrics
- Transaction success rate
- Average confirmation time
- Email delivery rate
- User session duration
- Wallet connection errors

---

## Deployment Checklist

- [ ] Set Solana cluster (devnet/testnet/mainnet)
- [ ] Deploy Anchor program
- [ ] Create USDC mint (or use existing)
- [ ] Configure backend `.env` (SendGrid, JWT secret)
- [ ] Configure frontend `.env` (RPC, program ID, USDC mint)
- [ ] Test full user flow
- [ ] Setup monitoring
- [ ] Configure domain/DNS
- [ ] Enable HTTPS
- [ ] Set up CI/CD

---

**Last Updated**: January 2025
