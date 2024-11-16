import algosdk from 'algosdk';
import { readFile } from 'fs/promises';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';
import { Buffer } from 'buffer';

// Load environment variables
config();

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Type definition for creator
interface Creator {
  addr: string;
  sk: Uint8Array;
}

// Validate environment variables
if (!process.env.CREATOR_ADDRESS || !process.env.CREATOR_SK) {
  throw new Error('Missing environment variables. Please set CREATOR_ADDRESS and CREATOR_SK');
}

// Create creator object with proper type checking
const creator: Creator = {
  addr: process.env.CREATOR_ADDRESS,
  sk: new Uint8Array(Buffer.from(process.env.CREATOR_SK, 'base64'))
};

async function deployContract() {
  try {
    // Initialize the Algorand client (use TestNet first)
    const algodClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', '');
    
    // Read the TEAL file using proper path resolution
    const tealPath = resolve(__dirname, '../contracts/atomic_swap.teal');
    const tealCode = await readFile(tealPath, 'utf8');
    
    // Compile the TEAL code
    const compiledResponse = await algodClient.compile(tealCode).do();
    const compiledBytes = new Uint8Array(Buffer.from(compiledResponse.result, 'base64'));
    
    // Get suggested parameters
    const suggestedParams = await algodClient.getTransactionParams().do();
    
    // Create application
    const appTxn = algosdk.makeApplicationCreateTxn(
      creator.addr,
      suggestedParams,
      algosdk.OnApplicationComplete.NoOpOC,
      compiledBytes,
      compiledBytes,
      4, // numLocalInts
      2, // numLocalBytes
      4, // numGlobalInts
      2, // numGlobalBytes
      []  // app args
    );
    
    // Sign and submit the transaction
    const signedTxn = appTxn.signTxn(creator.sk);
    const { txId } = await algodClient.sendRawTransaction(signedTxn).do();
    
    // Wait for confirmation
    const result = await algosdk.waitForConfirmation(algodClient, txId, 4);
    const appId = result['application-index'];
    console.log('Contract deployed with App ID:', appId);
    
    return appId;
  } catch (error) {
    console.error('Error deploying contract:', error);
    throw error;
  }
}

// Self-executing async function to handle top-level await
(async () => {
  try {
    await deployContract();
  } catch (error) {
    console.error('Deployment failed:', error);
    process.exit(1);
  }
})(); 