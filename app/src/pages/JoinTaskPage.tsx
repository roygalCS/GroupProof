import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import PhantomConnectButton from '../components/PhantomConnectButton';
import { SystemProgram } from '@solana/web3.js';
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { useProgram } from '../hooks/useProgram';
import { useTask } from '../hooks/useTask';
import { USDC_MINT, getTaskPDA, getEscrowPDA, getMemberPDA } from '../utils/anchor';
import { formatTimestamp } from '../utils/time';
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
const DEV_MODE = import.meta.env.VITE_ENABLE_DEV_MODE === 'true';

export default function JoinTaskPage() {
  const { inviteCode } = useParams();
  const navigate = useNavigate();
  const { publicKey, connected } = useWallet();
  const program = useProgram();

  const [taskId, setTaskId] = useState<string>('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [devJoined, setDevJoined] = useState(false);
  const [devJoinLoading, setDevJoinLoading] = useState(false);

  const { task, loading: taskLoading } = useTask(taskId);

  // Verify invite code
  useEffect(() => {
    async function verifyInvite() {
      if (!inviteCode) {
        setError('Invalid invite link');
        setVerifying(false);
        return;
      }

      try {
        const response = await axios.get(`${BACKEND_URL}/api/verify-invite/${inviteCode}`);
        setTaskId(response.data.taskId);
        setEmail(response.data.email);
        setVerifying(false);
      } catch (err: any) {
        console.error('Error verifying invite:', err);
        if (err.code === 'ERR_NETWORK' || err.message?.includes('Network Error')) {
          setError('Cannot connect to server. The invite link may be using localhost. Please contact the task creator for a public link.');
        } else {
          setError('Invalid or expired invite link');
        }
        setVerifying(false);
      }
    }

    verifyInvite();
  }, [inviteCode]);

  // Auto-join in dev mode when wallet connects
  useEffect(() => {
    if (!DEV_MODE) return;
    if (!connected || !publicKey || !taskId) return;
    if (devJoined || devJoinLoading) return;

    const doDevJoin = async () => {
      try {
        setDevJoinLoading(true);
        const resp = await axios.post(`${BACKEND_URL}/api/dev/join`, {
          taskId,
          wallet: publicKey.toString(),
          email,
        });

        if (resp.data?.success) {
          setDevJoined(true);
          setSuccess('Auto-joined in dev-mode (no on-chain deposit).');
          // Navigate to dashboard after a short delay
          setTimeout(() => navigate(`/task/${taskId}`), 800);
        } else {
          setError('Dev join failed');
        }
      } catch (err) {
        console.error('Dev join error:', err);
        setError('Dev join failed: ' + (err instanceof Error ? err.message : String(err)));
      } finally {
        setDevJoinLoading(false);
      }
    };

    doDevJoin();
  }, [DEV_MODE, connected, publicKey, taskId, devJoined, devJoinLoading, email, navigate]);

  const handleJoin = async () => {
    if (!connected || !publicKey || !program || !task) {
      setError('Please connect your wallet first');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Check if join window is still open
      const now = Math.floor(Date.now() / 1000);
      if (now > task.joinWindowTimestamp) {
        throw new Error('Join window has closed');
      }

      // Get PDAs
      const taskPDA = await getTaskPDA(taskId);
      const escrowPDA = await getEscrowPDA(taskPDA);
      const memberPDA = await getMemberPDA(taskPDA, publicKey);

      // Get member's USDC token account
      const memberTokenAccount = await getAssociatedTokenAddress(
        USDC_MINT,
        publicKey
      );

      // Hash the email (simple hash for demo - use proper hashing in production)
      const emailHash = btoa(email.toLowerCase());

      // Join and deposit
      const tx = await program.methods
        .joinAndDeposit(emailHash)
        .accounts({
          task: taskPDA,
          member: memberPDA,
          memberTokenAccount,
          escrowAccount: escrowPDA,
          memberSigner: publicKey,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();

      console.log('Joined task! Transaction:', tx);
      setSuccess('Successfully joined the task and deposited stake!');

      // Navigate to task dashboard after 2 seconds
      setTimeout(() => {
        navigate(`/task/${taskId}`);
      }, 2000);

    } catch (err) {
      console.error('Error joining task:', err);
      setError(err instanceof Error ? err.message : 'Failed to join task');
    } finally {
      setLoading(false);
    }
  };

  if (verifying || taskLoading) {
    return (
      <div className="app">
        <header className="header">
          <h1>SmartDeadlines</h1>
          <PhantomConnectButton />
        </header>
        <div className="container">
          <div className="loading">
            <div className="spinner"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <h1 onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>SmartDeadlines</h1>
        <PhantomConnectButton />
      </header>

      <div className="container">
        <div className="card" style={{ maxWidth: '600px', margin: '2rem auto' }}>
          <h2>Join Task</h2>

          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          {task ? (
            <>
              <div className="alert alert-info">
                <strong>You've been invited to join:</strong>
                <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                  Task ID: {task.taskId}
                </p>
              </div>

              <div style={{ marginTop: '1.5rem' }}>
                <h3 style={{ marginBottom: '1rem', color: '#667eea' }}>Task Details</h3>

                <div style={{ marginBottom: '1rem' }}>
                  <strong>Your Email:</strong> {email}
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <strong>Stake Required:</strong> {task.stakePerMember / 1_000_000} USDC
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <strong>Members:</strong> {task.memberCount} / {task.requiredMembers}
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <strong>Join Window Closes:</strong> {formatTimestamp(task.joinWindowTimestamp)}
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <strong>Task Deadline:</strong> {formatTimestamp(task.deadlineTimestamp)}
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <strong>Charity Address:</strong>
                  <div style={{ fontSize: '0.8rem', wordBreak: 'break-all', color: '#666' }}>
                    {task.charityPubkey.toString()}
                  </div>
                </div>
              </div>

              <div className="alert alert-warning" style={{ marginTop: '1.5rem' }}>
                <strong>Important:</strong> By joining, you agree to deposit {task.stakePerMember / 1_000_000} USDC.
                You'll get it back if the task is completed successfully and majority votes YES.
                Otherwise, all funds go to the charity address.
              </div>

              {connected ? (
                <button
                  onClick={handleJoin}
                  disabled={loading || task.memberCount >= task.requiredMembers}
                  style={{ marginTop: '1.5rem', width: '100%' }}
                >
                  {loading ? 'Joining...' : 'Join & Deposit Stake'}
                </button>
              ) : (
                <div className="alert alert-info" style={{ marginTop: '1.5rem' }}>
                  Please connect your wallet to join this task
                </div>
              )}
            </>
          ) : (
            <div className="alert alert-error">
              Task not found or invalid invite link
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
