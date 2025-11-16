import { useParams, useNavigate } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import PhantomConnectButton from '../components/PhantomConnectButton';
import { useTask } from '../hooks/useTask';
import { useUserTasks } from '../hooks/useUserTasks';
import { useCountdown } from '../hooks/useCountdown';
import { formatTimestamp, formatTimeRemaining } from '../utils/time';
import { getIPFSUrl } from '../utils/ipfs';

// Fixed: Complete rewrite with proper JSX structure

export default function TaskDashboardPage() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const { publicKey, connected } = useWallet();

  // Use useTask for single task view (when taskId is in URL)
  const { task: singleTask, loading: singleLoading, error: singleError } = useTask(taskId);

  // Use useUserTasks for dashboard view (when no taskId in URL)
  const { tasks: allTasks, loading: allLoading, error: allError } = useUserTasks(publicKey);

  const now = Math.floor(Date.now() / 1000);

  const getTaskStatus = (task: any) => {
    if (task.finalized) return 'Finalized';
    if (now > task.deadlineTimestamp) return 'Voting';
    if (now > task.joinWindowTimestamp) return 'Active';
    return 'Joining';
  };

  const isCreator = (task: any) => connected && publicKey && task.creator.equals(publicKey);

  const getVoteOutcome = (task: any) => {
    const totalVotes = task.yesVotes + task.noVotes;
    if (totalVotes === 0) return null;
    const majorityThreshold = Math.floor(totalVotes / 2) + 1;
    return {
      willRefund: task.yesVotes >= majorityThreshold,
      yesVotes: task.yesVotes,
      noVotes: task.noVotes,
      totalVotes,
    };
  };

  // Single task detail view (when taskId is in URL)
  if (taskId) {
    const joinWindowCountdown = useCountdown(singleTask?.joinWindowTimestamp || 0);
    const deadlineCountdown = useCountdown(singleTask?.deadlineTimestamp || 0);

    if (singleLoading) {
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

    if (singleError || !singleTask) {
      return (
        <div className="app">
          <header className="header">
            <h1 onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>SmartDeadlines</h1>
            <PhantomConnectButton />
          </header>
          <div className="container">
            <div className="alert alert-error">
              {singleError || 'Task not found'}
            </div>
            <button onClick={() => navigate('/dashboard')} className="button-secondary" style={{ marginTop: '1rem' }}>
              Back to Dashboard
            </button>
          </div>
        </div>
      );
    }

    const status = getTaskStatus(singleTask);
    const voteOutcome = getVoteOutcome(singleTask);
    const isOwner = isCreator(singleTask);

    return (
      <div className="app">
        <header className="header">
          <h1 onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>SmartDeadlines</h1>
          <PhantomConnectButton />
        </header>

        <div className="container">
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2>Task Details</h2>
              <span className={`status-badge ${status.toLowerCase()}`}>
                {status}
              </span>
            </div>

            <div style={{ marginTop: '1rem', padding: '1rem', background: '#f9fafb', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>Task ID</div>
              <div style={{ fontFamily: 'monospace', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                {singleTask.taskId}
              </div>
            </div>
          </div>

          <div className="grid">
            <div className="stat-card">
              <div className="label">Stake Per Member</div>
              <div className="value">{singleTask.stakePerMember / 1_000_000} USDC</div>
            </div>

            <div className="stat-card">
              <div className="label">Members</div>
              <div className="value">
                {singleTask.memberCount} / {singleTask.requiredMembers}
              </div>
            </div>

            <div className="stat-card">
              <div className="label">Total Deposited</div>
              <div className="value">{singleTask.totalDeposited / 1_000_000} USDC</div>
            </div>
          </div>

          {status === 'Joining' && joinWindowCountdown.total > 0 && (
            <div className="countdown">
              <h3>Join Window Closes In</h3>
              <div className="time">{formatTimeRemaining(singleTask.joinWindowTimestamp)}</div>
            </div>
          )}

          {status === 'Active' && deadlineCountdown.total > 0 && (
            <div className="countdown">
              <h3>Deadline In</h3>
              <div className="time">{formatTimeRemaining(singleTask.deadlineTimestamp)}</div>
            </div>
          )}

          <div className="card">
            <h3 style={{ marginBottom: '1rem', color: '#667eea' }}>Timeline</h3>

            <div style={{ marginBottom: '1rem' }}>
              <strong>Join Window Closes:</strong> {formatTimestamp(singleTask.joinWindowTimestamp)}
              {joinWindowCountdown.total > 0 && (
                <span style={{ marginLeft: '0.5rem', color: '#f59e0b' }}>
                  ({formatTimeRemaining(singleTask.joinWindowTimestamp)})
                </span>
              )}
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <strong>Task Deadline:</strong> {formatTimestamp(singleTask.deadlineTimestamp)}
              {deadlineCountdown.total > 0 && (
                <span style={{ marginLeft: '0.5rem', color: '#f59e0b' }}>
                  ({formatTimeRemaining(singleTask.deadlineTimestamp)})
                </span>
              )}
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <strong>Description:</strong>{' '}
              <a
                href={getIPFSUrl(singleTask.descriptionCid)}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#667eea' }}
              >
                View on IPFS
              </a>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <strong>Charity Address:</strong>
              <div style={{ fontSize: '0.8rem', wordBreak: 'break-all', color: '#666', marginTop: '0.25rem' }}>
                {singleTask.charityPubkey.toString()}
              </div>
            </div>
          </div>

          {status === 'Voting' || status === 'Finalized' ? (
            <div className="card">
              <h3 style={{ marginBottom: '1rem', color: '#667eea' }}>Voting Results</h3>

              <div className="grid">
                <div className="stat-card" style={{ background: '#10b981' }}>
                  <div className="label">YES Votes</div>
                  <div className="value">{singleTask.yesVotes}</div>
                </div>

                <div className="stat-card" style={{ background: '#ef4444' }}>
                  <div className="label">NO Votes</div>
                  <div className="value">{singleTask.noVotes}</div>
                </div>
              </div>

              {voteOutcome && (
                <div className={`alert ${voteOutcome.willRefund ? 'alert-success' : 'alert-error'}`} style={{ marginTop: '1rem' }}>
                  <strong>
                    {voteOutcome.willRefund
                      ? 'Task Successful - Members can claim refunds'
                      : 'Task Failed - Funds will be donated to charity'}
                  </strong>
                  <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                    {voteOutcome.yesVotes} YES vs {voteOutcome.noVotes} NO
                    {' '}(Majority needed: {Math.floor(voteOutcome.totalVotes / 2) + 1})
                  </p>
                </div>
              )}
            </div>
          ) : null}

          <div className="card">
            <h3 style={{ marginBottom: '1rem', color: '#667eea' }}>Actions</h3>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
              {isOwner && status === 'Active' && (
                <button onClick={() => navigate(`/task/${taskId}/submit-proof`)}>
                  Submit Proof of Completion
                </button>
              )}

              {connected && status === 'Voting' && (
                <button onClick={() => navigate(`/task/${taskId}/vote`)}>
                  Cast Your Vote
                </button>
              )}

              {connected && status === 'Voting' && singleTask.yesVotes + singleTask.noVotes === singleTask.memberCount && (
                <button
                  onClick={() => navigate(`/task/${taskId}/finalize`)}
                  className="button-success"
                >
                  Finalize Task
                </button>
              )}

              {connected && status === 'Finalized' && voteOutcome?.willRefund && (
                <button
                  onClick={() => navigate(`/task/${taskId}/finalize`)}
                  className="button-success"
                >
                  Claim Refund
                </button>
              )}

              <button
                onClick={() => navigate('/dashboard')}
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

  // Dashboard view (when no taskId in URL)
  if (!connected) {
    return (
      <div className="app">
        <header className="header">
          <h1 onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>SmartDeadlines</h1>
          <PhantomConnectButton />
        </header>
        <div className="container">
          <div className="card">
            <h2>Task Dashboard</h2>
            <div className="alert alert-info">
              Please connect your wallet to view your tasks.
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Add error boundary for debugging
  console.log('TaskDashboardPage - connected:', connected, 'publicKey:', publicKey, 'allLoading:', allLoading, 'allError:', allError, 'allTasks:', allTasks);

  if (allLoading) {
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

  if (allError) {
    console.error('TaskDashboardPage error:', allError);
    return (
      <div className="app">
        <header className="header">
          <h1 onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>SmartDeadlines</h1>
          <PhantomConnectButton />
        </header>
        <div className="container">
          <div className="alert alert-error">
            <strong>Error loading tasks:</strong> {allError}
            <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
              This might happen if you haven't created any tasks yet, or if there's a connection issue.
            </p>
          </div>
          <button onClick={() => navigate('/')} style={{ marginTop: '1rem' }}>
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // Safety check
  if (!allTasks) {
    console.error('allTasks is null or undefined');
    return (
      <div className="app">
        <header className="header">
          <h1 onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>SmartDeadlines</h1>
          <PhantomConnectButton />
        </header>
        <div className="container">
          <div className="alert alert-error">
            Unexpected error: Tasks data is unavailable
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
        <div className="card">
          <h2>Your Tasks</h2>
          <p style={{ color: '#666', marginTop: '0.5rem' }}>
            {allTasks.length === 0 ? (
              <>You don't have any tasks yet.</>
            ) : (
              <>You have {allTasks.length} task{allTasks.length !== 1 ? 's' : ''}.</>
            )}
          </p>
        </div>

        {allTasks.length === 0 ? (
          <div className="card">
            <div className="alert alert-info">
              <strong>No tasks found</strong>
              <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                You can create a new task or wait to be invited to join one.
              </p>
            </div>
            <button onClick={() => navigate('/')} style={{ marginTop: '1rem' }}>
              Create a New Task
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {allTasks.map((task) => {
              const status = getTaskStatus(task);
              const voteOutcome = getVoteOutcome(task);
              const isOwner = isCreator(task);

              return (
                <div key={task.taskId} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div>
                      <h3 style={{ marginBottom: '0.5rem', color: '#667eea' }}>
                        Task: {task.taskId}
                      </h3>
                      <div style={{ fontSize: '0.9rem', color: '#666' }}>
                        {isOwner ? (
                          <span style={{ background: '#667eea', color: '#fff', padding: '0.25rem 0.75rem', borderRadius: '4px', marginRight: '0.5rem' }}>
                            Creator
                          </span>
                        ) : (
                          <span style={{ background: '#10b981', color: '#fff', padding: '0.25rem 0.75rem', borderRadius: '4px', marginRight: '0.5rem' }}>
                            Member
                          </span>
                        )}
                      </div>
                    </div>
                    <span className={`status-badge ${status.toLowerCase()}`}>
                      {status}
                    </span>
                  </div>

                  <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                    <div>
                      <div style={{ fontSize: '0.85rem', color: '#666' }}>Stake</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
                        {task.stakePerMember / 1_000_000} USDC
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '0.85rem', color: '#666' }}>Members</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
                        {task.memberCount} / {task.requiredMembers}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '0.85rem', color: '#666' }}>Total Deposited</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
                        {task.totalDeposited / 1_000_000} USDC
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '0.85rem', color: '#666' }}>Join Closes</div>
                      <div style={{ fontSize: '0.9rem' }}>
                        {formatTimeRemaining(task.joinWindowTimestamp)}
                      </div>
                    </div>
                  </div>

                  {(status === 'Voting' || status === 'Finalized') && (
                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <div style={{ background: '#d1fae5', padding: '0.75rem', borderRadius: '6px', textAlign: 'center' }}>
                          <div style={{ fontSize: '0.85rem', color: '#065f46' }}>YES Votes</div>
                          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#059669' }}>
                            {task.yesVotes}
                          </div>
                        </div>
                        <div style={{ background: '#fee2e2', padding: '0.75rem', borderRadius: '6px', textAlign: 'center' }}>
                          <div style={{ fontSize: '0.85rem', color: '#7f1d1d' }}>NO Votes</div>
                          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#dc2626' }}>
                            {task.noVotes}
                          </div>
                        </div>
                      </div>

                      {voteOutcome && (
                        <div className={`alert ${voteOutcome.willRefund ? 'alert-success' : 'alert-error'}`}>
                          {voteOutcome.willRefund
                            ? '✓ Task Successful - Members can claim refunds'
                            : '✗ Task Failed - Funds go to charity'}
                        </div>
                      )}
                    </div>
                  )}

                  <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    {isOwner && status === 'Active' && (
                      <button onClick={() => navigate(`/task/${task.taskId}/submit-proof`)} style={{ fontSize: '0.9rem' }}>
                        Submit Proof
                      </button>
                    )}

                    {connected && status === 'Voting' && (
                      <button onClick={() => navigate(`/task/${task.taskId}/vote`)} style={{ fontSize: '0.9rem' }}>
                        Vote
                      </button>
                    )}

                    {connected && task.yesVotes + task.noVotes === task.memberCount && status === 'Voting' && (
                      <button onClick={() => navigate(`/task/${task.taskId}/finalize`)} className="button-success" style={{ fontSize: '0.9rem' }}>
                        Finalize
                      </button>
                    )}

                    {connected && status === 'Finalized' && voteOutcome?.willRefund && (
                      <button onClick={() => navigate(`/task/${task.taskId}/finalize`)} className="button-success" style={{ fontSize: '0.9rem' }}>
                        Claim Refund
                      </button>
                    )}

                    <button
                      onClick={() => navigate(`/task/${task.taskId}`)}
                      className="button-secondary"
                      style={{ fontSize: '0.9rem' }}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="card" style={{ marginTop: '2rem' }}>
          <button onClick={() => navigate('/')} className="button-secondary" style={{ width: '100%' }}>
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
