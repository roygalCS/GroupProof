import { useNavigate } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import PhantomConnectButton from '../components/PhantomConnectButton';

export default function HomePage() {
  const navigate = useNavigate();
  const { connected, publicKey } = useWallet();
  
  // Debug logging
  console.log('HomePage render - connected:', connected, 'publicKey:', publicKey);

  return (
    <div className="app">
      <header className="header">
        <h1>SmartDeadlines</h1>
        <PhantomConnectButton />
      </header>

      <div className="container">
        <div className="card" style={{ maxWidth: '800px', margin: '3rem auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
            On-Chain Accountability for Group Tasks
          </h2>
          <p style={{ fontSize: '1.2rem', color: '#666', marginBottom: '2rem' }}>
            Create group tasks with SPL-USDC stakes. Complete the task, get your money back.
            Fail, and funds go to charity.
          </p>

          {connected && publicKey ? (
            <div>
              <div className="alert alert-success" style={{ marginBottom: '1.5rem' }}>
                <strong>✓ Wallet Connected</strong>
                <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', wordBreak: 'break-all' }}>
                  {publicKey.toString()}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button 
                  onClick={() => {
                    console.log('Create Task button clicked');
                    navigate('/create');
                  }} 
                  style={{ 
                    fontSize: '1.1rem', 
                    padding: '1rem 2rem',
                    cursor: 'pointer',
                    pointerEvents: 'auto',
                    zIndex: 10
                  }}
                >
                  Create New Task
                </button>
                <button
                  onClick={() => {
                    console.log('View Tasks button clicked');
                    navigate('/dashboard');
                  }}
                  className="button-secondary"
                  style={{ 
                    fontSize: '1.1rem', 
                    padding: '1rem 2rem',
                    cursor: 'pointer',
                    pointerEvents: 'auto',
                    zIndex: 10
                  }}
                >
                  View My Tasks
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="alert alert-info" style={{ marginBottom: '1.5rem' }}>
                <strong>🔐 Connect Your Wallet</strong>
                <p style={{ marginTop: '0.5rem' }}>
                  Use the <em>Connect Wallet</em> button in the top-right to connect Phantom and interact with the app.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="grid">
          <div className="stat-card">
            <div className="label">How It Works</div>
            <div className="value" style={{ fontSize: '1rem', fontWeight: 'normal', marginTop: '1rem' }}>
              1. Create a task with deadlines
              <br />
              2. Invite team members via email
              <br />
              3. Everyone stakes USDC
              <br />
              4. Complete & vote on success
              <br />
              5. Refund or donate to charity
            </div>
          </div>

          <div className="stat-card">
            <div className="label">Why SmartDeadlines?</div>
            <div className="value" style={{ fontSize: '1rem', fontWeight: 'normal', marginTop: '1rem' }}>
              Financial accountability
              <br />
              Transparent on-chain voting
              <br />
              Automatic fund distribution
              <br />
              IPFS proof of work
              <br />
              Support good causes
            </div>
          </div>

          <div className="stat-card">
            <div className="label">Perfect For</div>
            <div className="value" style={{ fontSize: '1rem', fontWeight: 'normal', marginTop: '1rem' }}>
              College group projects
              <br />
              Study groups
              <br />
              Research teams
              <br />
              Hackathon teams
              <br />
              Any collaborative work
            </div>
          </div>
        </div>

        <div className="card" style={{ marginTop: '2rem' }}>
          <h2>🔐 About Wallet Connection</h2>

          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ color: '#667eea', marginBottom: '0.5rem' }}>Phantom Wallet (Recommended)</h3>
            <p style={{ marginBottom: '0.5rem' }}>
              Phantom is the most popular Solana wallet with excellent security and user experience.
            </p>
            <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>
              Status: <span style={{ background: '#D1FAE5', color: '#065F46', padding: '0.25rem 0.75rem', borderRadius: '4px' }}>
                Ready Now
              </span>
            </p>
            <a
              href="https://phantom.app/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-block',
                padding: '0.5rem 1rem',
                background: '#667eea',
                color: 'white',
                borderRadius: '6px',
                textDecoration: 'none',
                fontSize: '0.9rem',
                fontWeight: 600
              }}
            >
              Get Phantom Wallet →
            </a>
          </div>

        </div>
      </div>
    </div>
  );
}
