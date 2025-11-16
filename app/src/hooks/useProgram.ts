import { useConnection, useAnchorWallet } from '@solana/wallet-adapter-react';
import { useMemo } from 'react';
import { getProgram } from '../utils/anchor';

export function useProgram() {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  const program = useMemo(() => {
    if (!wallet) return null;
    return getProgram(connection, wallet);
  }, [connection, wallet]);

  return program;
}
