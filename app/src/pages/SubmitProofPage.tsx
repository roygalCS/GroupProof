import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import PhantomConnectButton from '../components/PhantomConnectButton';
import { useProgram } from '../hooks/useProgram';
import { useTask } from '../hooks/useTask';
import { getTaskPDA, getMemberPDA } from '../utils/anchor';
import { uploadToIPFS } from '../utils/ipfs';
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
const DEV_MODE = import.meta.env.VITE_ENABLE_DEV_MODE === 'true';

export default function SubmitProofPage() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const { publicKey, connected } = useWallet();
  const program = useProgram();
  const { task, loading: taskLoading } = useTask(taskId);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!connected || !publicKey || !task) {
      setError('Please connect your wallet first');
      return;
    }

    if (!selectedFile) {
      setError('Please select a file to upload');
      return;
    }

    // Verify user is the task creator (on-chain rules may enforce this)
    if (!task.creator.equals(publicKey) && !DEV_MODE) {
      setError('Only the task creator can submit proof');
      return;
    }

    setError('');
    setSuccess('');

    try {
      // Upload file to IPFS
      setUploading(true);
      const { cid: proofCid } = await uploadToIPFS(selectedFile);
      console.log('Proof uploaded to IPFS:', proofCid);
      setUploading(false);

      if (DEV_MODE) {
        // Record simulated submission in backend (dev-only)
        setSubmitting(true);
        await axios.post(`${BACKEND_URL}/api/dev/submit-proof`, {
          taskId,
          wallet: publicKey.toString(),
          cid: proofCid,
        });

        setSuccess('Dev-mode: proof recorded (no on-chain submission)');
        setTimeout(() => navigate(`/task/${taskId}`), 1200);
        return;
      }

      // Submit proof on-chain
      setSubmitting(true);
      const taskPDA = await getTaskPDA(taskId!);
      const memberPDA = await getMemberPDA(taskPDA, publicKey);

      const tx = await program.methods
        .submitProof(proofCid)
        .accounts({
          task: taskPDA,
          member: memberPDA,
          memberSigner: publicKey,
        })
        .rpc();

      console.log('Proof submitted! Transaction:', tx);
      setSuccess('Proof submitted successfully!');

      // Navigate back to dashboard after 2 seconds
      setTimeout(() => {
        navigate(`/task/${taskId}`);
      }, 2000);

    } catch (err) {
      console.error('Error submitting proof:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit proof');
    } finally {
      setUploading(false);
      setSubmitting(false);
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

  return (
    <div className="app">
      <header className="header">
        <h1 onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>SmartDeadlines</h1>
        <PhantomConnectButton />
      </header>

      <div className="container">
        <div className="card" style={{ maxWidth: '600px', margin: '2rem auto' }}>
          <h2>Submit Proof of Completion</h2>

          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          {task && (
            <>
              <div className="alert alert-info">
                <strong>Task ID:</strong> {task.taskId}
              </div>

              <form onSubmit={handleSubmit} style={{ marginTop: '1.5rem' }}>
                <div className="form-group">
                  <label>Upload Proof File</label>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept="*/*"
                    required
                  />
                  <div className="helper-text">
                    Upload any file that proves task completion (PDF, images, documents, etc.)
                    This will be stored on IPFS.
                  </div>
                </div>

                {selectedFile && (
                  <div style={{ padding: '1rem', background: '#f9fafb', borderRadius: '8px', marginBottom: '1rem' }}>
                    <strong>Selected file:</strong> {selectedFile.name}
                    <br />
                    <span style={{ fontSize: '0.9rem', color: '#666' }}>
                      Size: {(selectedFile.size / 1024).toFixed(2)} KB
                    </span>
                  </div>
                )}

                <div className="alert alert-warning">
                  <strong>Important:</strong> Once submitted, this proof will be visible to all task members
                  who will vote on whether the task was completed successfully.
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                  <button
                    type="submit"
                    disabled={!connected || uploading || submitting || !selectedFile}
                  >
                    {uploading ? 'Uploading to IPFS...' : submitting ? 'Submitting...' : 'Submit Proof'}
                  </button>
                  <button
                    type="button"
                    className="button-secondary"
                    onClick={() => navigate(`/task/${taskId}`)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
