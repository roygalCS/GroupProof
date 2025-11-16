import { useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';

// Import wallet adapter CSS
import '@solana/wallet-adapter-react-ui/styles.css';

// Import pages
import HomePage from './pages/HomePage';
import CreateTaskPage from './pages/CreateTaskPage';
import JoinTaskPage from './pages/JoinTaskPage';
import TaskDashboardPage from './pages/TaskDashboardPage';
import SubmitProofPage from './pages/SubmitProofPage';
import VotePage from './pages/VotePage';
import FinalizePage from './pages/FinalizePage';
import ErrorBoundary from './components/ErrorBoundary';
// Phantom-only wallet integration: Phantom is the single supported adapter.

function App() {
  // Use Devnet only (ignore any VITE_SOLANA_RPC_URL overrides)
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = useMemo(() => clusterApiUrl(network), []);

  // Log the active RPC endpoint so you can verify in the browser console
  if (typeof window !== 'undefined') {
    // eslint-disable-next-line no-console
    console.log('SmartDeadlines: using Solana RPC endpoint (forced):', endpoint);
  }

  // Initialize wallets - Phantom only
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect={false}>
        <WalletModalProvider>
          <Router>
            <ErrorBoundary>
              <div className="app">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  {/* Wallet info page removed; Phantom is the only supported wallet. */}
                  <Route path="/create" element={<CreateTaskPage />} />
                  <Route path="/join/:inviteCode" element={<JoinTaskPage />} />
                  <Route path="/dashboard" element={<TaskDashboardPage />} />
                  <Route path="/task/:taskId" element={<TaskDashboardPage />} />
                  <Route path="/task/:taskId/submit-proof" element={<SubmitProofPage />} />
                  <Route path="/task/:taskId/vote" element={<VotePage />} />
                  <Route path="/task/:taskId/finalize" element={<FinalizePage />} />
                </Routes>
              </div>
            </ErrorBoundary>
          </Router>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export default App;
