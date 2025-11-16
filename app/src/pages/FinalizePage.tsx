import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import PhantomConnectButton from '../components/PhantomConnectButton';
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { useProgram } from '../hooks/useProgram';
import { useTask } from '../hooks/useTask';
import { USDC_MINT, getTaskPDA, getEscrowPDA, getMemberPDA } from '../utils/anchor';

export default function FinalizePage() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const { publicKey, connected } = useWallet();
  const program = useProgram();
  const { task, loading: taskLoading } = useTask(taskId);

  const [action, setAction] = useState<'finalize' | 'claim'>('finalize');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (task && task.finalized) {
      setAction('claim');
    }
  }, [task]);

  const handleFinalize = async () => {
    if (!connected || !publicKey || !program || !task) {
      setError('Please connect your wallet first');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const taskPDA = await getTaskPDA(taskId!);
      const escrowPDA = await getEscrowPDA(taskPDA);

      // Get charity token account
      const charityTokenAccount = await getAssociatedTokenAddress(
        USDC_MINT,
        task.charityPubkey
      );

      const tx = await program.methods
        .finalize()
        .accounts({
          task: taskPDA,
          escrowAccount: escrowPDA,
          charityTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();

      console.log('Task finalized! Transaction:', tx);
      setSuccess('Task finalized successfully!');

      // Refresh page after 2 seconds
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (err) {
      console.error('Error finalizing task:', err);
      setError(err instanceof Error ? err.message : 'Failed to finalize task');
    } finally {
      setLoading(false);
    }
  };

  const handleClaimRefund = async () => {
    if (!connected || !publicKey || !program || !task) {
      setError('Please connect your wallet first');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const taskPDA = await getTaskPDA(taskId!);
      const memberPDA = await getMemberPDA(taskPDA, publicKey);
      const escrowPDA = await getEscrowPDA(taskPDA);

      // Get member's token account
      const memberTokenAccount = await getAssociatedTokenAddress(
        USDC_MINT,
        publicKey
      );

      const tx = await program.methods
        .claimRefund()
        .accounts({
          task: taskPDA,
          member: memberPDA,
          escrowAccount: escrowPDA,
          memberTokenAccount,
          memberSigner: publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();

      console.log('Refund claimed! Transaction:', tx);
      setSuccess(`Successfully claimed refund of ${task.stakePerMember / 1_000_000} USDC!`);

      // Navigate to dashboard after 2 seconds
      setTimeout(() => {
        navigate(`/task/${taskId}`);
      }, 2000);

    } catch (err) {
      console.error('Error claiming refund:', err);
      setError(err instanceof Error ? err.message : 'Failed to claim refund');
    } finally {
      setLoading(false);
    }
  };

  if (taskLoading) {
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

  if (!task) {
    return (
      <div className="app">
        <header className="header">
          <h1 onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>SmartDeadlines</h1>
          <PhantomConnectButton />
        </header>
        <div className="container">
          <div className="alert alert-error">Task not found</div>
        </div>
      </div>
    );
  }

  const totalVotes = task.yesVotes + task.noVotes;
  const majorityThreshold = Math.floor(totalVotes / 2) + 1;
  const willRefund = task.yesVotes >= majorityThreshold;
  const allVoted = totalVotes === task.memberCount;

  return (
    <div className="app">
      <header className="header">
        <h1 onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>SmartDeadlines</h1>
        <PhantomConnectButton />
      </header>

      <div className="container">
        <div className="card" style={{ maxWidth: '600px', margin: '2rem auto' }}>
          <h2>{action === 'finalize' ? 'Finalize Task' : 'Claim Refund'}</h2>

          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <div className="alert alert-info">
            <strong>Task ID:</strong> {task.taskId}
          </div>

          <div className="grid" style={{ marginTop: '1.5rem' }}>
            <div className="stat-card" style={{ background: '#10b981' }}>
              <div className="label">YES Votes</div>
              <div className="value">{task.yesVotes}</div>
            </div>

            <div className="stat-card" style={{ background: '#ef4444' }}>
              <div className="label">NO Votes</div>
              <div className="value">{task.noVotes}</div>
            </div>
          </div>

          {!allVoted && !task.finalized && (
            <div className="alert alert-warning" style={{ marginTop: '1.5rem' }}>
              Waiting for all members to vote ({totalVotes} / {task.memberCount} voted)
            </div>
          )}

          {action === 'finalize' && (
            <>
              <div className={`alert ${willRefund ? 'alert-success' : 'alert-error'}`} style={{ marginTop: '1.5rem' }}>
                <strong>Outcome:</strong>{' '}
                {willRefund
                  ? 'Task Successful - Members will be able to claim refunds'
                  : 'Task Failed - All funds will be sent to charity'}
                <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                  {task.yesVotes} YES vs {task.noVotes} NO (Majority: {majorityThreshold})
                </p>
              </div>

              <div className="alert alert-info" style={{ marginTop: '1rem' }}>
                {willRefund ? (
                  <>
                    Once finalized, each member can claim their {task.stakePerMember / 1_000_000} USDC refund.
                  </>
                ) : (
                  <>
                    Once finalized, all {task.totalDeposited / 1_000_000} USDC will be sent to the charity address.
                  </>
                )}
              </div>

              {allVoted && (
                <button
                  onClick={handleFinalize}
                  disabled={loading || !connected || task.finalized}
                  style={{ marginTop: '1.5rem', width: '100%' }}
                  className="button-success"
                >
                  {loading ? 'Finalizing...' : 'Finalize Task'}
                </button>
              )}
            </>
          )}

          {action === 'claim' && (
            <>
              {willRefund ? (
                <>
                  <div className="alert alert-success" style={{ marginTop: '1.5rem' }}>
                    <strong>Congratulations!</strong> The task was completed successfully.
                    You can now claim your refund of {task.stakePerMember / 1_000_000} USDC.
                  </div>

                  <button
                    onClick={handleClaimRefund}
                    disabled={loading || !connected}
                    style={{ marginTop: '1.5rem', width: '100%' }}
                    className="button-success"
                  >
                    {loading ? 'Claiming...' : `Claim ${task.stakePerMember / 1_000_000} USDC Refund`}
                  </button>
                </>
              ) : (
                <div className="alert alert-error" style={{ marginTop: '1.5rem' }}>
                  <strong>Task Failed</strong>
                  <p style={{ marginTop: '0.5rem' }}>
                    The task was not completed successfully. All funds have been donated to charity.
                  </p>
                </div>
              )}
            </>
          )}

          <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            <button
              onClick={() => navigate(`/task/${taskId}`)}
              className="button-secondary"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
