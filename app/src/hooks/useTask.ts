import { useEffect, useState } from 'react';
import { PublicKey } from '@solana/web3.js';
import { useConnection } from '@solana/wallet-adapter-react';
import { useProgram } from './useProgram';
import { getTaskPDA } from '../utils/anchor';

export interface TaskData {
  creator: PublicKey;
  stakePerMember: number;
  requiredMembers: number;
  memberCount: number;
  joinWindowTimestamp: number;
  deadlineTimestamp: number;
  charityPubkey: PublicKey;
  descriptionCid: string;
  yesVotes: number;
  noVotes: number;
  finalized: boolean;
  totalDeposited: number;
  taskId: string;
  bump: number;
  escrowBump: number;
}

export function useTask(taskId: string | undefined) {
  const program = useProgram();
  const { connection } = useConnection();
  const [task, setTask] = useState<TaskData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!taskId || !program) {
      setLoading(false);
      return;
    }

    let mounted = true;

    async function fetchTask() {
      try {
        setLoading(true);
        setError(null);

        const taskPDA = await getTaskPDA(taskId);
        const taskAccount = await program!.account.task.fetch(taskPDA);

        if (mounted) {
          setTask({
            creator: taskAccount.creator as PublicKey,
            stakePerMember: (taskAccount.stakePerMember as any).toNumber(),
            requiredMembers: taskAccount.requiredMembers as number,
            memberCount: taskAccount.memberCount as number,
            joinWindowTimestamp: (taskAccount.joinWindowTimestamp as any).toNumber(),
            deadlineTimestamp: (taskAccount.deadlineTimestamp as any).toNumber(),
            charityPubkey: taskAccount.charityPubkey as PublicKey,
            descriptionCid: taskAccount.descriptionCid as string,
            yesVotes: taskAccount.yesVotes as number,
            noVotes: taskAccount.noVotes as number,
            finalized: taskAccount.finalized as boolean,
            totalDeposited: (taskAccount.totalDeposited as any).toNumber(),
            taskId: taskAccount.taskId as string,
            bump: taskAccount.bump as number,
            escrowBump: taskAccount.escrowBump as number,
          });
        }
      } catch (err) {
        console.error('Error fetching task:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch task');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchTask();

    return () => {
      mounted = false;
    };
  }, [taskId, program, connection]);

  return { task, loading, error };
}
