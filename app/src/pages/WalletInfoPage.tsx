import { useNavigate } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import PhantomConnectButton from '../components/PhantomConnectButton';

export default function WalletInfoPage() {
    const navigate = useNavigate();
    const { connected } = useWallet();

    return (
        <div className="app">
            <header className="header">
                <h1 onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>SmartDeadlines</h1>
                <PhantomConnectButton />
            </header>

            <div className="container">
                <div className="card" style={{ maxWidth: '900px', margin: '2rem auto' }}>
                    <h2>💼 About Wallet Connection</h2>

                    {connected ? (
                        <div className="alert alert-success" style={{ marginBottom: '2rem' }}>
                            ✓ Your wallet is connected and ready to use SmartDeadlines!
                        </div>
                    ) : null}

                    <div style={{ marginBottom: '2rem' }}>
                        <h3 style={{ fontSize: '1.3rem', color: '#667eea', marginBottom: '1rem' }}>👻 Phantom Wallet (Recommended)</h3>

                        <div style={{ background: '#F3F4F6', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                            <p><strong>Phantom</strong> is the most popular and trusted Solana wallet with excellent user experience.</p>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <strong style={{ display: 'block', marginBottom: '0.5rem' }}>Key Features:</strong>
                            <ul style={{ marginLeft: '1.5rem', color: '#666' }}>
                                <li>Easy-to-use interface</li>
                                <li>Hardware wallet integration</li>
                                <li>NFT support and gallery</li>
                                <li>Built-in swap functionality</li>
                                <li>Extensive token support</li>
                            </ul>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <strong style={{ display: 'block', marginBottom: '0.5rem' }}>Current Status:</strong>
                            <div style={{ background: '#D1FAE5', color: '#065F46', padding: '0.75rem', borderRadius: '6px', display: 'inline-block' }}>
                                ✅ Ready to Use
                            </div>
                            <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#666' }}>
                                Phantom is fully integrated and tested with SmartDeadlines. Use it now to get started!
                            </p>
                        </div>

                        <a
                            href="https://phantom.app/"
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
                            Get Phantom Wallet →
                        </a>
                    </div>

                    <div style={{ borderTop: '2px solid #E5E7EB', paddingTop: '2rem' }}>
                        <h3 style={{ fontSize: '1.3rem', marginBottom: '1rem' }}>
                            🔗 Other Notes
                        </h3>

                        <p style={{ marginBottom: '1rem', color: '#666' }}>
                            SmartDeadlines currently supports Phantom as the primary wallet. Additional adapters may be added in the future.
                        </p>

                        <div className="alert alert-info">
                            <strong>💡 Tip:</strong> Click the "Connect Wallet" button in the header to connect Phantom.
                        </div>
                    </div>

                    <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                        {!connected ? (
                            <button
                                onClick={() => navigate('/')}
                                style={{ padding: '0.75rem 2rem', fontSize: '1rem' }}
                            >
                                Return to Home & Connect Wallet
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={() => navigate('/create')}
                                    style={{ padding: '0.75rem 2rem', fontSize: '1rem', marginRight: '1rem' }}
                                >
                                    Create a Task
                                </button>
                                <button
                                    onClick={() => navigate('/')}
                                    className="button-secondary"
                                    style={{ padding: '0.75rem 2rem', fontSize: '1rem' }}
                                >
                                    Back to Home
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

