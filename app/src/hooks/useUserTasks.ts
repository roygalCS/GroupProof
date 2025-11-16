import { useEffect, useState } from 'react';
import { PublicKey } from '@solana/web3.js';
import { useConnection } from '@solana/wallet-adapter-react';
import { useProgram } from './useProgram';
import { TaskData } from './useTask';

export function useUserTasks(userPublicKey: PublicKey | null | undefined) {
    const program = useProgram();
    const { connection } = useConnection();
    const [tasks, setTasks] = useState<TaskData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!userPublicKey || !program) {
            setLoading(false);
            return;
        }

        let mounted = true;

        async function fetchUserTasks() {
            try {
                setLoading(true);
                setError(null);

                if (!userPublicKey) {
                    setLoading(false);
                    return;
                }

                // Fetch all task accounts created by the user
                const createdTasks = await program!.account.task.all([
                    {
                        memcmp: {
                            offset: 8 + 32, // discriminator + creator (first field after discriminator)
                            bytes: userPublicKey.toBase58(),
                        },
                    },
                ]);

                // Fetch all member accounts for this user
                // Note: Member accounts don't have an "owner" field in the same way
                // We'll skip this for now and just show created tasks
                const memberAccounts: any[] = [];
                // TODO: Fix member account filtering - need to check actual account structure

                // Get unique task PDAs from member accounts
                const joinedTaskPDAs = [...new Set(memberAccounts.map(acc => (acc.account as any).task.toString()))];

                // Fetch task data for joined tasks
                const joinedTasksData = await Promise.all(
                    joinedTaskPDAs.map(async (taskPDAStr) => {
                        try {
                            const taskPDA = new PublicKey(taskPDAStr);
                            const taskAccount = await program!.account.task.fetch(taskPDA);
                            return {
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
                            };
                        } catch (err) {
                            console.error(`Failed to fetch task ${taskPDAStr}:`, err);
                            return null;
                        }
                    })
                );

                // Convert created tasks to TaskData format
                const createdTasksData = createdTasks.map((acc) => ({
                    creator: acc.account.creator as PublicKey,
                    stakePerMember: (acc.account.stakePerMember as any).toNumber(),
                    requiredMembers: acc.account.requiredMembers as number,
                    memberCount: acc.account.memberCount as number,
                    joinWindowTimestamp: (acc.account.joinWindowTimestamp as any).toNumber(),
                    deadlineTimestamp: (acc.account.deadlineTimestamp as any).toNumber(),
                    charityPubkey: acc.account.charityPubkey as PublicKey,
                    descriptionCid: acc.account.descriptionCid as string,
                    yesVotes: acc.account.yesVotes as number,
                    noVotes: acc.account.noVotes as number,
                    finalized: acc.account.finalized as boolean,
                    totalDeposited: (acc.account.totalDeposited as any).toNumber(),
                    taskId: acc.account.taskId as string,
                    bump: acc.account.bump as number,
                    escrowBump: acc.account.escrowBump as number,
                }));

                // Combine and deduplicate (in case user is both creator and member)
                const allTasks = [...createdTasksData, ...joinedTasksData.filter((t) => t !== null)];
                const uniqueTasks = Array.from(
                    new Map(allTasks.map((task) => [task.taskId, task])).values()
                );

                if (mounted) {
                    setTasks(uniqueTasks);
                }
            } catch (err) {
                console.error('Error fetching user tasks:', err);
                if (mounted) {
                    setError(err instanceof Error ? err.message : 'Failed to fetch tasks');
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        }

        fetchUserTasks();

        return () => {
            mounted = false;
        };
    }, [userPublicKey, program, connection]);

    return { tasks, loading, error };
}
