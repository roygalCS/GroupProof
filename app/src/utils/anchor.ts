import { AnchorProvider, Program, Idl } from '@coral-xyz/anchor';
import { Connection, PublicKey } from '@solana/web3.js';
import { AnchorWallet } from '@solana/wallet-adapter-react';
import idl from '../idl/smart_deadlines.json';

export const PROGRAM_ID = new PublicKey(
  import.meta.env.VITE_PROGRAM_ID || 'Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS'
);

export const USDC_MINT = new PublicKey(
  import.meta.env.VITE_USDC_MINT || '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'
);

export function getProvider(connection: Connection, wallet: AnchorWallet) {
  const provider = new AnchorProvider(connection, wallet, {
    commitment: 'confirmed',
  });
  return provider;
}

export function getProgram(connection: Connection, wallet: AnchorWallet) {
  const provider = getProvider(connection, wallet);
  return new Program(idl as Idl, PROGRAM_ID, provider);
}

export async function getTaskPDA(taskId: string) {
  const [taskPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('task'), Buffer.from(taskId)],
    PROGRAM_ID
  );
  return taskPDA;
}

export async function getEscrowPDA(taskPubkey: PublicKey) {
  const [escrowPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('escrow'), taskPubkey.toBuffer()],
    PROGRAM_ID
  );
  return escrowPDA;
}

export async function getMemberPDA(taskPubkey: PublicKey, memberPubkey: PublicKey) {
  const [memberPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('member'), taskPubkey.toBuffer(), memberPubkey.toBuffer()],
    PROGRAM_ID
  );
  return memberPDA;
}
