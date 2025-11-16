import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SmartDeadlines } from "../target/types/smart_deadlines";
import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";
import { assert } from "chai";

describe("smart-deadlines", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.SmartDeadlines as Program<SmartDeadlines>;

  let usdcMint: PublicKey;
  let creatorTokenAccount: PublicKey;
  let member1TokenAccount: PublicKey;
  let member2TokenAccount: PublicKey;
  let charityTokenAccount: PublicKey;

  const creator = provider.wallet;
  const member1 = anchor.web3.Keypair.generate();
  const member2 = anchor.web3.Keypair.generate();
  const charity = anchor.web3.Keypair.generate();

  const taskId = `test-task-${Date.now()}`;
  const stakePerMember = new anchor.BN(10_000_000); // 10 USDC
  const requiredMembers = 2;

  before(async () => {
    // Airdrop SOL to test accounts
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(
        member1.publicKey,
        2 * anchor.web3.LAMPORTS_PER_SOL
      )
    );

    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(
        member2.publicKey,
        2 * anchor.web3.LAMPORTS_PER_SOL
      )
    );

    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(
        charity.publicKey,
        1 * anchor.web3.LAMPORTS_PER_SOL
      )
    );

    // Create USDC mint
    usdcMint = await createMint(
      provider.connection,
      creator.payer,
      creator.publicKey,
      null,
      6 // USDC has 6 decimals
    );

    console.log("USDC Mint:", usdcMint.toString());

    // Create token accounts
    const creatorAccount = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      creator.payer,
      usdcMint,
      creator.publicKey
    );
    creatorTokenAccount = creatorAccount.address;

    const member1Account = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      creator.payer,
      usdcMint,
      member1.publicKey
    );
    member1TokenAccount = member1Account.address;

    const member2Account = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      creator.payer,
      usdcMint,
      member2.publicKey
    );
    member2TokenAccount = member2Account.address;

    const charityAccount = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      creator.payer,
      usdcMint,
      charity.publicKey
    );
    charityTokenAccount = charityAccount.address;

    // Mint USDC to creator and members
    await mintTo(
      provider.connection,
      creator.payer,
      usdcMint,
      creatorTokenAccount,
      creator.publicKey,
      100_000_000 // 100 USDC
    );

    await mintTo(
      provider.connection,
      creator.payer,
      usdcMint,
      member1TokenAccount,
      creator.publicKey,
      50_000_000 // 50 USDC
    );

    await mintTo(
      provider.connection,
      creator.payer,
      usdcMint,
      member2TokenAccount,
      creator.publicKey,
      50_000_000 // 50 USDC
    );

    console.log("Test accounts setup complete");
  });

  it("Creates a task", async () => {
    const [taskPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("task"), Buffer.from(taskId)],
      program.programId
    );

    const [escrowPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), taskPDA.toBuffer()],
      program.programId
    );

    const now = Math.floor(Date.now() / 1000);
    const joinWindow = now + 3600; // 1 hour
    const deadline = now + 7200; // 2 hours

    await program.methods
      .createTask(
        stakePerMember,
        requiredMembers,
        new anchor.BN(joinWindow),
        new anchor.BN(deadline),
        charity.publicKey,
        "QmTestCID123",
        taskId
      )
      .accounts({
        task: taskPDA,
        escrowAccount: escrowPDA,
        usdcMint: usdcMint,
        creator: creator.publicKey,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .rpc();

    const taskAccount = await program.account.task.fetch(taskPDA);
    assert.equal(taskAccount.requiredMembers, requiredMembers);
    assert.equal(taskAccount.memberCount, 0);
    assert.equal(taskAccount.taskId, taskId);
  });

  it("Member 1 joins and deposits", async () => {
    const [taskPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("task"), Buffer.from(taskId)],
      program.programId
    );

    const [memberPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("member"), taskPDA.toBuffer(), member1.publicKey.toBuffer()],
      program.programId
    );

    const [escrowPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), taskPDA.toBuffer()],
      program.programId
    );

    await program.methods
      .joinAndDeposit("member1@example.com")
      .accounts({
        task: taskPDA,
        member: memberPDA,
        memberTokenAccount: member1TokenAccount,
        escrowAccount: escrowPDA,
        memberSigner: member1.publicKey,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([member1])
      .rpc();

    const taskAccount = await program.account.task.fetch(taskPDA);
    assert.equal(taskAccount.memberCount, 1);
  });

  it("Member 2 joins and deposits", async () => {
    const [taskPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("task"), Buffer.from(taskId)],
      program.programId
    );

    const [memberPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("member"), taskPDA.toBuffer(), member2.publicKey.toBuffer()],
      program.programId
    );

    const [escrowPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), taskPDA.toBuffer()],
      program.programId
    );

    await program.methods
      .joinAndDeposit("member2@example.com")
      .accounts({
        task: taskPDA,
        member: memberPDA,
        memberTokenAccount: member2TokenAccount,
        escrowAccount: escrowPDA,
        memberSigner: member2.publicKey,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([member2])
      .rpc();

    const taskAccount = await program.account.task.fetch(taskPDA);
    assert.equal(taskAccount.memberCount, 2);
  });

  it("Creator submits proof", async () => {
    const [taskPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("task"), Buffer.from(taskId)],
      program.programId
    );

    const [memberPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("member"), taskPDA.toBuffer(), creator.publicKey.toBuffer()],
      program.programId
    );

    // First, creator needs to join
    const [escrowPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), taskPDA.toBuffer()],
      program.programId
    );

    await program.methods
      .joinAndDeposit("creator@example.com")
      .accounts({
        task: taskPDA,
        member: memberPDA,
        memberTokenAccount: creatorTokenAccount,
        escrowAccount: escrowPDA,
        memberSigner: creator.publicKey,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    // Now submit proof
    await program.methods
      .submitProof("QmProofCID456")
      .accounts({
        task: taskPDA,
        member: memberPDA,
        memberSigner: creator.publicKey,
      })
      .rpc();

    const memberAccount = await program.account.member.fetch(memberPDA);
    assert.equal(memberAccount.proofCid, "QmProofCID456");
  });

  console.log("All tests passed!");
});
