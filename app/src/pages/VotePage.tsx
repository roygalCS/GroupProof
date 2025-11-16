import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import PhantomConnectButton from '../components/PhantomConnectButton';
import { PublicKey } from '@solana/web3.js';
import { useProgram } from '../hooks/useProgram';
import { useTask } from '../hooks/useTask';
import { getTaskPDA, getMemberPDA } from '../utils/anchor';
import { getIPFSUrl } from '../utils/ipfs';

export default function VotePage() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const { publicKey, connected } = useWallet();
  const program = useProgram();
  const { task, loading: taskLoading } = useTask(taskId);

  const [proofCid, setProofCid] = useState<string>('');
  const [hasVoted, setHasVoted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch member's proof CID
  useEffect(() => {
    async function fetchProof() {
      if (!task || !program || !publicKey) return;

      try {
        const taskPDA = await getTaskPDA(taskId!);
        const creatorMemberPDA = await getMemberPDA(taskPDA, task.creator);

        const memberAccount = await program.account.member.fetch(creatorMemberPDA);
        setProofCid((memberAccount.proofCid as string) || '');

        // Check if current user has voted
        const currentUserMemberPDA = await getMemberPDA(taskPDA, publicKey);
        try {
          const currentUserMember = await program.account.member.fetch(currentUserMemberPDA);
          setHasVoted(currentUserMember.voted as boolean);
        } catch {
          // User is not a member
          setError('You are not a member of this task');
        }
      } catch (err) {
        console.error('Error fetching proof:', err);
      }
    }

    fetchProof();
  }, [task, program, publicKey, taskId]);

  const handleVote = async (voteYes: boolean) => {
    if (!connected || !publicKey || !program || !task) {
      setError('Please connect your wallet first');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const now = Math.floor(Date.now() / 1000);
      if (now <= task.deadlineTimestamp) {
        throw new Error('Cannot vote until after the deadline');
      }

      const taskPDA = await getTaskPDA(taskId!);
      const memberPDA = await getMemberPDA(taskPDA, publicKey);

      const tx = await program.methods
        .vote(voteYes)
        .accounts({
          task: taskPDA,
          member: memberPDA,
          voter: publicKey,
        })
        .rpc();

      console.log('Vote submitted! Transaction:', tx);
      setSuccess(`Vote recorded: ${voteYes ? 'YES' : 'NO'}`);
      setHasVoted(true);

      // Navigate back to dashboard after 2 seconds
      setTimeout(() => {
        navigate(`/task/${taskId}`);
      }, 2000);

    } catch (err) {
      console.error('Error voting:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit vote');
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

  const now = Math.floor(Date.now() / 1000);
  const canVote = task && now > task.deadlineTimestamp && !hasVoted;

  return (
    <div className="app">
      <header className="header">
        <h1 onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>SmartDeadlines</h1>
        <PhantomConnectButton />
      </header>

      <div className="container">
        <div className="card" style={{ maxWidth: '700px', margin: '2rem auto' }}>
          <h2>Vote on Task Completion</h2>

          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          {task && (
            <>
              <div className="alert alert-info">
                <strong>Task ID:</strong> {task.taskId}
              </div>

              {now <= task.deadlineTimestamp && (
                <div className="alert alert-warning" style={{ marginTop: '1rem' }}>
                  Voting will open after the deadline has passed.
                </div>
              )}

              {hasVoted && (
                <div className="alert alert-success" style={{ marginTop: '1rem' }}>
                  You have already voted on this task.
                </div>
              )}

              {proofCid && (
                <div className="card" style={{ marginTop: '1.5rem', background: '#f9fafb' }}>
                  <h3 style={{ marginBottom: '1rem', color: '#667eea' }}>Submitted Proof</h3>
                  <a
                    href={getIPFSUrl(proofCid)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-block',
                      padding: '0.75rem 1.5rem',
                      background: '#667eea',
                      color: 'white',
                      borderRadius: '8px',
                      textDecoration: 'none',
                      fontWeight: 600,
                    }}
                  >
                    View Proof on IPFS
                  </a>
                  <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: '#666', wordBreak: 'break-all' }}>
                    CID: {proofCid}
                  </div>
                </div>
              )}

              {!proofCid && (
                <div className="alert alert-warning" style={{ marginTop: '1.5rem' }}>
                  No proof has been submitted yet.
                </div>
              )}

              <div className="card" style={{ marginTop: '1.5rem', background: '#fef3c7' }}>
                <h3 style={{ marginBottom: '1rem', color: '#92400e' }}>Voting Instructions</h3>
                <p style={{ color: '#78350f', marginBottom: '0.5rem' }}>
                  Review the submitted proof and vote on whether the task was completed successfully:
                </p>
                <ul style={{ color: '#78350f', marginLeft: '1.5rem', marginTop: '0.5rem' }}>
                  <li><strong>Vote YES</strong> if the task was completed satisfactorily</li>
                  <li><strong>Vote NO</strong> if the task was not completed or was unsatisfactory</li>
                </ul>
                <p style={{ color: '#78350f', marginTop: '1rem', fontWeight: 600 }}>
                  If majority votes YES: Everyone gets their stake back
                  <br />
                  If majority votes NO or it's a tie: All stakes go to charity
                </p>
              </div>

              {canVote && connected && (
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'center' }}>
                  <button
                    onClick={() => handleVote(true)}
                    disabled={loading}
                    className="button-success"
                    style={{ minWidth: '150px' }}
                  >
                    {loading ? 'Submitting...' : 'Vote YES'}
                  </button>
                  <button
                    onClick={() => handleVote(false)}
                    disabled={loading}
                    className="button-danger"
                    style={{ minWidth: '150px' }}
                  >
                    {loading ? 'Submitting...' : 'Vote NO'}
                  </button>
                </div>
              )}

              <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                <button
                  onClick={() => navigate(`/task/${taskId}`)}
                  className="button-secondary"
                >
                  Back to Dashboard
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
