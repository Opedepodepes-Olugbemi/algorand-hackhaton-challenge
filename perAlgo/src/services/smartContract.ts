import algosdk from 'algosdk';

export class AtomicSwapContract {
  private algodClient: algosdk.Algodv2;
  private appId: number;

  constructor(algodClient: algosdk.Algodv2, appId: number) {
    this.algodClient = algodClient;
    this.appId = appId;
  }

  async createSwapOffer(
    creator: string,
    asset1Id: number,
    asset1Amount: number,
    asset2Id: number,
    asset2Amount: number
  ) {
    const suggestedParams = await this.algodClient.getTransactionParams().do();
    
    const createTxn = algosdk.makeApplicationCallTxnFromObject({
      from: creator,
      appIndex: this.appId,
      onComplete: algosdk.OnApplicationComplete.NoOpOC,
      appArgs: [
        new TextEncoder().encode('create'),
        algosdk.encodeUint64(asset1Id),
        algosdk.encodeUint64(asset1Amount),
        algosdk.encodeUint64(asset2Id),
        algosdk.encodeUint64(asset2Amount)
      ],
      suggestedParams
    });

    return createTxn;
  }

  async acceptSwapOffer(
    taker: string,
    asset1Id: number,
    asset1Amount: number,
    asset2Id: number,
    asset2Amount: number
  ) {
    const suggestedParams = await this.algodClient.getTransactionParams().do();
    
    // Create atomic transaction group
    const acceptTxn = algosdk.makeApplicationCallTxnFromObject({
      from: taker,
      appIndex: this.appId,
      onComplete: algosdk.OnApplicationComplete.NoOpOC,
      appArgs: [new TextEncoder().encode('accept')],
      suggestedParams
    });

    const asset1Transfer = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      from: taker,
      to: await this.getCreatorAddress(),
      amount: asset2Amount,
      assetIndex: asset2Id,
      suggestedParams
    });

    const txns = [acceptTxn, asset1Transfer];
    algosdk.assignGroupID(txns);
    
    return txns;
  }

  async cancelSwapOffer(creator: string) {
    const suggestedParams = await this.algodClient.getTransactionParams().do();
    
    const cancelTxn = algosdk.makeApplicationCallTxnFromObject({
      from: creator,
      appIndex: this.appId,
      onComplete: algosdk.OnApplicationComplete.DeleteApplicationOC,
      appArgs: [new TextEncoder().encode('cancel')],
      suggestedParams
    });

    return cancelTxn;
  }

  private async getCreatorAddress(): Promise<string> {
    const appInfo = await this.algodClient.getApplicationByID(this.appId).do();
    return appInfo.params['creator'];
  }
} 