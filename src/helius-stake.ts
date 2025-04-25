import bs58 from 'bs58';
import {
  Authorized,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  StakeProgram,
  Transaction
} from '@solana/web3.js';
import { Helius } from 'helius-sdk';
import dotenv from 'dotenv';

dotenv.config();

const helius = new Helius(process.env.HELIUS_API_KEY!);


async function createStakeTransaction(
  owner: Keypair,
  stakes: { votePubkey: PublicKey; amountSol: number }[]
): Promise<{ transaction: Transaction; stakeAccountPubkeys: PublicKey[] }> {
  const rentExempt = await helius.connection.getMinimumBalanceForRentExemption(
    StakeProgram.space
  );

  console.log("Rent exempt:", rentExempt);

  const transaction = new Transaction();
  const stakeAccounts: Keypair[] = [];
  const stakeAccountPubkeys: PublicKey[] = [];

  for (const { votePubkey, amountSol } of stakes) {
    const lamports = amountSol * LAMPORTS_PER_SOL + rentExempt;
    const stakeAccount = Keypair.generate();
    stakeAccounts.push(stakeAccount);
    stakeAccountPubkeys.push(stakeAccount.publicKey);

    transaction.add(
      StakeProgram.createAccount({
        fromPubkey: owner.publicKey,
        stakePubkey: stakeAccount.publicKey,
        lamports,
        authorized: new Authorized(owner.publicKey, owner.publicKey),
      })
    );

    transaction.add(
      StakeProgram.delegate({
        stakePubkey: stakeAccount.publicKey,
        authorizedPubkey: owner.publicKey,
        votePubkey,
      })
    );
  }

  const { blockhash, lastValidBlockHeight } =
    await helius.connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.lastValidBlockHeight = lastValidBlockHeight;
  transaction.feePayer = owner.publicKey;

  // Sign with owner and all new stake accounts
  transaction.sign(owner, ...stakeAccounts);

  return {
    transaction,
    stakeAccountPubkeys,
  };
}

function loadOwnerKeypairFromEnv(): Keypair {
  const ownerSecret = process.env.OWNER_PRIVATE_KEY;
  if (!ownerSecret) {
    throw new Error("OWNER_PRIVATE_KEY not set in .env");
  }
  let secretKey: Uint8Array;
  try {
    // Only support base58
    secretKey = bs58.decode(ownerSecret);
  } catch (e) {
    throw new Error("Failed to decode OWNER_PRIVATE_KEY as base58: " + e);
  }
  return Keypair.fromSecretKey(secretKey);
}

async function main() {
  // Load owner keypair from .env
  const owner = loadOwnerKeypairFromEnv();
  console.log("Owner pubkey:", owner.publicKey.toBase58());

  const { transaction, stakeAccountPubkeys } = await createStakeTransaction(
    owner,
    [
      { votePubkey: new PublicKey("6D2jqw9hyVCpppZexquxa74Fn33rJzzBx38T58VucHx9"), amountSol: 0.0001 },
      { votePubkey: new PublicKey("8hPk5CbKDoM7dN9LssTdVkFhDykeq7A8CZurA5AQSFJH"), amountSol: 0.0001 },
    ]
  );

  // Send transaction
  const rawTx = transaction.serialize();
  const signature = await helius.connection.sendRawTransaction(rawTx);
  console.log("Transaction signature:", signature);
  console.log("Stake account pubkeys:", stakeAccountPubkeys.map(pk => pk.toBase58()));
}

main().catch(console.error);

