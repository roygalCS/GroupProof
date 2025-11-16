import { AnchorProvider, Program } from '@coral-xyz/anchor';
import { Connection, PublicKey } from '@solana/web3.js';
import { AnchorWallet } from '@solana/wallet-adapter-react';
import idlJson from '../idl/smart_deadlines.json';

// Type the IDL properly for Anchor 0.32.1
const idl = idlJson as any;

// Use the program ID from the IDL which matches the deployed program
export const PROGRAM_ID = new PublicKey(idl.address);

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
  return new Program(idl, PROGRAM_ID, provider);
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
