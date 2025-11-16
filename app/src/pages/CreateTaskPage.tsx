import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import PhantomConnectButton from '../components/PhantomConnectButton';
import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { BN } from '@coral-xyz/anchor';
import { useProgram } from '../hooks/useProgram';
import { USDC_MINT, getTaskPDA, getEscrowPDA } from '../utils/anchor';
import { uploadJSONToIPFS } from '../utils/ipfs';
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export default function CreateTaskPage() {
  const navigate = useNavigate();
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const program = useProgram();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    stakePerMember: '',
    memberEmails: '',
    joinWindowHours: '24',
    deadlineHours: '168',
    charityAddress: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!connected || !publicKey || !program) {
      setError('Please connect your wallet first');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validate inputs
      const emails = formData.memberEmails.split(',').map(e => e.trim()).filter(e => e);
      if (emails.length === 0) {
        throw new Error('Please provide at least one member email');
      }

      const stakeAmount = parseFloat(formData.stakePerMember);
      if (isNaN(stakeAmount) || stakeAmount <= 0) {
        throw new Error('Invalid stake amount');
      }

      const joinWindowHours = parseFloat(formData.joinWindowHours);
      const deadlineHours = parseFloat(formData.deadlineHours);

      if (isNaN(joinWindowHours) || joinWindowHours <= 0) {
        throw new Error('Invalid join window (hours)');
      }

      if (isNaN(deadlineHours) || deadlineHours <= 0) {
        throw new Error('Invalid deadline (hours)');
      }

      if (deadlineHours <= joinWindowHours) {
        throw new Error('Deadline must be after join window');
      }

      // Upload task description to IPFS
      const descriptionData = {
        title: formData.title,
        description: formData.description,
        createdAt: new Date().toISOString(),
      };

      console.log('Uploading description to IPFS...');
      const { cid: descriptionCid } = await uploadJSONToIPFS(descriptionData);
      console.log('✅ Description uploaded to IPFS:', descriptionCid);

      // Generate unique task ID
      const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Calculate timestamps
      const now = Math.floor(Date.now() / 1000);
      const joinWindowTimestamp = now + (joinWindowHours * 60 * 60);
      const deadlineTimestamp = now + (deadlineHours * 60 * 60);

      // Get PDAs
      const taskPDA = await getTaskPDA(taskId);
      const escrowPDA = await getEscrowPDA(taskPDA);

      // Convert stake to lamports (USDC has 6 decimals)
      const stakePerMemberLamports = Math.floor(stakeAmount * 1_000_000);

      // Create task on-chain
      const charityPubkey = new PublicKey(formData.charityAddress);

      // Convert all numbers to BN for Anchor
      const tx = await program.methods
        .createTask(
          new BN(stakePerMemberLamports),
          emails.length,
          new BN(joinWindowTimestamp),
          new BN(deadlineTimestamp),
          charityPubkey,
          descriptionCid,
          taskId
        )
        .accounts({
          task: taskPDA,
          escrowAccount: escrowPDA,
          usdcMint: USDC_MINT,
          creator: publicKey,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .rpc();

      console.log('✅ Task created! Transaction:', tx);
      setSuccess(`Task created successfully! Task ID: ${taskId}`);

      // Send invitations via backend (non-blocking)
      console.log('Sending invitation emails...');
      try {
        const inviteResponse = await axios.post(`${BACKEND_URL}/api/invite`, {
          taskId,
          emails,
          taskTitle: formData.title,
          stakeAmount: stakeAmount,
          joinWindowTimestamp,
          creatorEmail: 'creator@example.com', // In production, get from user profile
        });

        if (inviteResponse.data.success) {
          console.log('✅ Invitation emails sent successfully');
          const successCount = inviteResponse.data.results.filter((r: any) => r.success).length;
          setSuccess(`Task created! Invitations sent to ${successCount}/${emails.length} members. Task ID: ${taskId}`);
        }
      } catch (emailError) {
        console.error('⚠️ Failed to send invitation emails:', emailError);
        // Don't fail the whole task creation if emails fail
        setSuccess(`Task created successfully (Task ID: ${taskId}), but invitation emails could not be sent. Please share the task link manually.`);
      }

      // Navigate to task dashboard after 2 seconds
      setTimeout(() => {
        navigate(`/task/${taskId}`);
      }, 2000);

    } catch (err) {
      console.error('Error creating task:', err);
      setError(err instanceof Error ? err.message : 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <header className="header">
        <h1 onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>SmartDeadlines</h1>
        <PhantomConnectButton />
      </header>

      <div className="container">
        <div className="card" style={{ maxWidth: '800px', margin: '2rem auto' }}>
          <h2>Create New Task</h2>

          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Task Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Final Year Project Submission"
                required
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe what needs to be accomplished..."
                required
              />
              <div className="helper-text">This will be stored on IPFS</div>
            </div>

            <div className="form-group">
              <label>Stake Amount (USDC per member)</label>
              <input
                type="number"
                name="stakePerMember"
                value={formData.stakePerMember}
                onChange={handleChange}
                placeholder="10.00"
                step="0.01"
                min="0.01"
                required
              />
              <div className="helper-text">Each member will deposit this amount in SPL-USDC</div>
            </div>

            <div className="form-group">
              <label>Member Email Addresses</label>
              <textarea
                name="memberEmails"
                value={formData.memberEmails}
                onChange={handleChange}
                placeholder="member1@email.com, member2@email.com, member3@email.com"
                required
              />
              <div className="helper-text">Comma-separated list of email addresses</div>
            </div>

            <div className="form-group">
              <label>Join Window (hours)</label>
              <input
                type="number"
                name="joinWindowHours"
                value={formData.joinWindowHours}
                onChange={handleChange}
                step="0.01"
                min="0.01"
                required
              />
              <div className="helper-text">How long members have to join and deposit</div>
            </div>

            <div className="form-group">
              <label>Deadline (hours from now)</label>
              <input
                type="number"
                name="deadlineHours"
                value={formData.deadlineHours}
                onChange={handleChange}
                step="0.01"
                min="0.02"
                required
              />
              <div className="helper-text">When the task must be completed</div>
            </div>

            <div className="form-group">
              <label>Charity Wallet Address (SPL-USDC)</label>
              <input
                type="text"
                name="charityAddress"
                value={formData.charityAddress}
                onChange={handleChange}
                placeholder="Enter Solana address that will receive USDC if task fails"
                required
              />
              <div className="helper-text">
                This address will receive all staked funds if the task is not completed successfully
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button type="submit" disabled={loading || !connected}>
                {loading ? 'Creating Task...' : 'Create Task'}
              </button>
              <button
                type="button"
                className="button-secondary"
                onClick={() => navigate('/')}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
