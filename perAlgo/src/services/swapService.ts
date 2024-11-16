import type { SwapOffer } from '../types/swap';
import { AtomicSwapContract } from './smartContract';
import algosdk from 'algosdk';

export class SwapService {
  private contract: AtomicSwapContract;
  private algodClient: algosdk.Algodv2;

  constructor(algodClient: algosdk.Algodv2, appId: number) {
    this.algodClient = algodClient;
    this.contract = new AtomicSwapContract(algodClient, appId);
  }

  async createOffer(offer: Omit<SwapOffer, 'id' | 'status' | 'createdAt'>) {
    const txn = await this.contract.createSwapOffer(
      offer.creator,
      offer.assetToSend.id,
      offer.assetToSend.amount,
      offer.assetToReceive.id,
      offer.assetToReceive.amount
    );

    // Return the transaction for signing
    return txn;
  }

  async acceptOffer(
    taker: string,
    offer: SwapOffer
  ) {
    const txns = await this.contract.acceptSwapOffer(
      taker,
      offer.assetToSend.id,
      offer.assetToSend.amount,
      offer.assetToReceive.id,
      offer.assetToReceive.amount
    );

    // Return the transactions for signing
    return txns;
  }

  async cancelOffer(creator: string, offerId: string) {
    const txn = await this.contract.cancelSwapOffer(creator);
    return txn;
  }

  async getOffers(): Promise<SwapOffer[]> {
    // For now, return an empty array
    // In a real implementation, this would fetch from your backend
    return [];
  }
} 