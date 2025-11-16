import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

export default function PhantomConnectButton() {
    const { connected, publicKey, connect, disconnect, select } = useWallet();

    const handleConnect = async () => {
        try {
            if (select) {
                try {
                    // try to select Phantom by name if available
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    await select('Phantom');
                } catch (e) {
                    // ignore
                }
            }
            await connect();
        } catch (err) {
            // eslint-disable-next-line no-console
            console.error('Connect failed', err);
        }
    };

    if (connected && publicKey) {
        return (
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <div style={{ fontSize: '0.9rem', wordBreak: 'break-all' }}>{publicKey.toString()}</div>
                <button onClick={() => disconnect()} className="button-secondary" style={{ padding: '0.4rem 0.8rem' }}>
                    Disconnect
                </button>
            </div>
        );
    }

    return (
        <button onClick={handleConnect} style={{ padding: '0.5rem 0.9rem', background: '#667eea', color: 'white', borderRadius: 6 }}>
            Connect Phantom
        </button>
    );
}
