import React, { useState, useEffect } from 'react';
import { PeraWalletConnect } from '@perawallet/connect';
import { Toaster } from 'react-hot-toast';
import algosdk from 'algosdk';
import { ConnectButton } from './components/ConnectButton';
import { NetworkSwitch } from './components/NetworkSwitch';
import { AssetCard } from './components/AssetCard';
import { DonationCard } from './components/DonationCard';
import type { VerifiedAsset, WalletState } from './types/pera';
import { Heart, Bell } from 'lucide-react';
import { notify } from './components/Notification';
import { TransactionProgress } from './components/TransactionProgress';
import { NotificationHistory } from './components/NotificationHistory';
import { getNotifications, clearNotifications, setNotificationChangeHandler } from './components/Notification';
import type { SwapOffer } from './types/swap';
import { SwapCreate } from './components/SwapCreate';
import { SwapList } from './components/SwapList';
import { SwapService } from './services/swapService';

const peraWallet = new PeraWalletConnect({
  shouldShowSignTxnToast: false
});

// Network configurations
const NETWORKS = {
  MainNet: {
    algod: new algosdk.Algodv2('', 'https://mainnet-api.algonode.cloud', ''),
    indexer: new algosdk.Indexer('', 'https://mainnet-idx.algonode.cloud', ''),
  },
  TestNet: {
    algod: new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', ''),
    indexer: new algosdk.Indexer('', 'https://testnet-idx.algonode.cloud', ''),
  }
};

// Your wallet address for donations (use different addresses for different networks)
const DONATION_ADDRESSES = {
  MainNet: 'YJ5EFJPM3TYIP23SOOJWVAUVMKBJVGIZCNNIIZO652ZUSSTMGVIGMLC5YM',
  TestNet: 'YJ5EFJPM3TYIP23SOOJWVAUVMKBJVGIZCNNIIZO652ZUSSTMGVIGMLC5YM' // Replace with your testnet address
};

const VERIFIED_ASSETS = {
  MainNet: [
    31566704,  // USDC
    312769,    // USDT
    27165954,  // PLANET
    226701642, // DEFLY
    283820866, // XSOL
    470842789, // ALGO/USDC
    386192725  // goETH
  ],
  TestNet: [
    10458941,  // USDC
    10471299,  // PLANET
    10458941,  // USDT
    67396430,  // goETH
    67396147   // TEST
  ]
};

// Add this constant near other constants
const ASSET_METADATA = {
  MainNet: {
    31566704: {  // USDC
      logo: "https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png",
      name: "USDC",
      unit_name: "USDC",
    },
    312769: {    // USDT
      logo: "https://assets.coingecko.com/coins/images/325/small/Tether.png",
      name: "Tether USDt",
      unit_name: "USDt",
    },
    27165954: {  // PLANET
      logo: "https://assets.coingecko.com/coins/images/24436/small/planetwatch.PNG",
      name: "Planet",
      unit_name: "PLANET",
    },
    226701642: { // DEFLY
      logo: "https://assets.coingecko.com/coins/images/24437/small/defly.PNG",
      name: "Defly Token",
      unit_name: "DEFLY",
    },
    283820866: { // XSOL
      logo: "https://assets.coingecko.com/coins/images/4128/small/solana.png",
      name: "Wrapped SOL",
      unit_name: "xSOL",
    },
    470842789: { // ALGO/USDC
      logo: "https://assets.coingecko.com/coins/images/4380/small/download.png",
      name: "Algo/USDC Pool",
      unit_name: "TMPOOL1",
    },
    386192725: { // goETH
      logo: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
      name: "Governance ETH",
      unit_name: "goETH",
    }
  },
  TestNet: {
    10458941: {  // USDC
      logo: "https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png",
      name: "USDC",
      unit_name: "USDC",
    },
    10471299: {  // PLANET
      logo: "https://assets.coingecko.com/coins/images/24436/small/planetwatch.PNG",
      name: "Planet",
      unit_name: "PLANET",
    },
    67396430: {  // goETH
      logo: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
      name: "Governance ETH",
      unit_name: "goETH",
    },
    67396147: {  // TEST
      logo: "https://assets.coingecko.com/coins/images/4380/small/download.png",
      name: "Test Asset",
      unit_name: "TEST",
    }
  }
};

// Add this after the NETWORKS constant
const SWAP_APP_ID = {
  MainNet: 12345, // Replace with your deployed contract ID
  TestNet: 67890  // Replace with your deployed contract ID
};

function App() {
  const [walletState, setWalletState] = useState<WalletState>({
    address: null,
    network: 'MainNet',
    isConnected: false,
  });
  const [assets, setAssets] = useState<VerifiedAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [txProgress, setTxProgress] = useState({
    step: 0,
    totalSteps: 3,
    message: ''
  });
  const [notifications, setNotifications] = useState(getNotifications());
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [swapOffers, setSwapOffers] = useState<SwapOffer[]>([]);
  const [swapService] = useState(() => new SwapService(
    NETWORKS[walletState.network].algod,
    SWAP_APP_ID[walletState.network]
  ));

  useEffect(() => {
    // Reconnect session
    peraWallet.reconnectSession().then((accounts) => {
      if (accounts.length) {
        setWalletState(prev => ({
          ...prev,
          address: accounts[0],
          isConnected: true,
        }));
      }
    });
  }, []); // Only run on mount

  useEffect(() => {
    if (walletState.isConnected) {
      fetchVerifiedAssets();
      fetchSwapOffers();
    } else {
      setAssets([]); // Clear assets when disconnected
    }
  }, [walletState.isConnected, walletState.network]); // Fetch when connection state or network changes

  useEffect(() => {
    setNotificationChangeHandler((newNotifications) => {
      setNotifications([...newNotifications]);
    });
  }, []);

  const fetchVerifiedAssets = async () => {
    setLoading(true);
    setError(null);
    try {
      const indexer = NETWORKS[walletState.network].indexer;
      const verifiedAssetIds = VERIFIED_ASSETS[walletState.network];
      const metadata = ASSET_METADATA[walletState.network];

      const assetPromises = verifiedAssetIds.map(async (assetId) => {
        const assetInfo = await indexer.lookupAssetByID(assetId).do();
        return {
          ...assetInfo.asset,
          ...metadata[assetId],
          id: assetId,
          verified: true
        };
      });

      const assetResults = await Promise.all(assetPromises);
      setAssets(assetResults);
    } catch (error) {
      console.error('Asset fetch error:', error);
      setError('Failed to load verified assets. Please try again later.');
      setAssets([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSwapOffers = async () => {
    try {
      const offers = await swapService.getOffers();
      setSwapOffers(offers);
    } catch (error) {
      console.error('Failed to fetch swap offers:', error);
      notify.error('Failed to load swap offers');
    }
  };

  const handleConnect = async () => {
    try {
      const accounts = await peraWallet.connect();
      setWalletState(prev => ({
        ...prev,
        address: accounts[0],
        isConnected: true,
      }));
      notify.success('Wallet connected successfully!');
    } catch (error) {
      console.error('Connection error:', error);
      notify.error('Failed to connect wallet');
    }
  };

  const handleDisconnect = async () => {
    try {
      await peraWallet.disconnect();
      setWalletState({
        address: null,
        network: walletState.network,
        isConnected: false,
      });
      setAssets([]);
      notify.success('Wallet disconnected');
    } catch (error) {
      console.error('Disconnect error:', error);
      notify.error('Failed to disconnect wallet');
    }
  };

  const handleDonation = async (amount: number) => {
    if (!walletState.address) {
      notify.warning('Please connect your wallet first');
      return;
    }

    try {
      const algodClient = NETWORKS[walletState.network].algod;
      const suggestedParams = await algodClient.getTransactionParams().do();
      
      notify.warning('Please confirm the transaction in your wallet');
      
      const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        from: walletState.address,
        to: DONATION_ADDRESSES[walletState.network],
        amount: Math.floor(amount * 1000000),
        suggestedParams,
      });

      const singleTxnGroups = [{ txn }];
      const signedTxn = await peraWallet.signTransaction([singleTxnGroups]);
      const { txId } = await algodClient.sendRawTransaction(signedTxn).do();
      
      notify.warning('Transaction submitted. Waiting for confirmation...');
      
      await algosdk.waitForConfirmation(algodClient, txId, 4);
      notify.success('Thank you for your donation! 💚');
    } catch (error) {
      console.error('Donation error:', error);
      notify.error(error instanceof Error ? error.message : 'Donation failed. Please try again.');
    }
  };

  const handleOptIn = async (assetId: number) => {
    if (!walletState.address) {
      notify.warning('Please connect your wallet first');
      return;
    }

    try {
      // Step 1: Preparing transaction
      setTxProgress({
        step: 1,
        totalSteps: 3,
        message: 'Preparing opt-in transaction...'
      });

      const algodClient = NETWORKS[walletState.network].algod;
      const suggestedParams = await algodClient.getTransactionParams().do();
      
      const txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        from: walletState.address,
        to: walletState.address,
        assetIndex: assetId,
        amount: 0,
        suggestedParams,
      });

      // Step 2: Signing transaction
      setTxProgress({
        step: 2,
        totalSteps: 3,
        message: 'Please sign the transaction in your wallet...'
      });
      
      notify.warning('Please confirm the opt-in transaction in your wallet');
      const signedTxn = await peraWallet.signTransaction([[{ txn }]]);
      
      // Step 3: Submitting and waiting for confirmation
      setTxProgress({
        step: 3,
        totalSteps: 3,
        message: 'Submitting transaction and waiting for confirmation...'
      });
      
      const { txId } = await algodClient.sendRawTransaction(signedTxn).do();
      await algosdk.waitForConfirmation(algodClient, txId, 4);
      
      notify.success('Asset opt-in successful!');

      // Reset progress after success
      setTimeout(() => {
        setTxProgress({
          step: 0,
          totalSteps: 3,
          message: ''
        });
      }, 2000);

    } catch (error) {
      console.error('Opt-in error:', error);
      notify.error(error instanceof Error ? error.message : 'Asset opt-in failed');
      
      // Reset progress on error
      setTxProgress({
        step: 0,
        totalSteps: 3,
        message: ''
      });
    }
  };

  const createSwapOffer = async (offer: Omit<SwapOffer, 'id' | 'status' | 'createdAt'>) => {
    if (!walletState.address) {
      notify.warning('Please connect your wallet first');
      return;
    }

    try {
      setTxProgress({
        step: 1,
        totalSteps: 4,
        message: 'Preparing swap transaction...'
      });

      const algodClient = NETWORKS[walletState.network].algod;
      const suggestedParams = await algodClient.getTransactionParams().do();

      // Create escrow transaction
      const escrowTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        from: walletState.address,
        to: offer.creator,
        assetIndex: offer.assetToSend.id,
        amount: offer.assetToSend.amount,
        suggestedParams,
      });

      setTxProgress({
        step: 2,
        totalSteps: 4,
        message: 'Please sign the escrow transaction...'
      });

      const signedTxn = await peraWallet.signTransaction([[{ txn: escrowTxn }]]);
      const { txId } = await algodClient.sendRawTransaction(signedTxn).do();

      setTxProgress({
        step: 3,
        totalSteps: 4,
        message: 'Submitting swap offer...'
      });

      // Create the offer in the service
      const newOffer = await swapService.createOffer({
        ...offer,
        creator: walletState.address,
      });

      setTxProgress({
        step: 4,
        totalSteps: 4,
        message: 'Finalizing swap offer...'
      });

      await algosdk.waitForConfirmation(algodClient, txId, 4);
      notify.success('Swap offer created successfully!');
      return newOffer;
    } catch (error) {
      console.error('Swap creation error:', error);
      notify.error('Failed to create swap offer');
      throw error;
    } finally {
      setTxProgress({
        step: 0,
        totalSteps: 4,
        message: ''
      });
    }
  };

  const acceptSwapOffer = async (offerId: string) => {
    if (!walletState.address) {
      notify.warning('Please connect your wallet first');
      return;
    }

    const offer = swapOffers.find(o => o.id === offerId);
    if (!offer) {
      throw new Error('Swap offer not found');
    }

    try {
      await swapService.acceptOffer(walletState.address, offer);
      await fetchSwapOffers(); // Refresh the list
      notify.success('Swap completed successfully');
    } catch (error) {
      console.error('Failed to accept swap:', error);
      notify.error('Failed to accept swap offer');
    }
  };

  const handleCreateSwap = async (offer: Omit<SwapOffer, 'id' | 'status' | 'createdAt'>) => {
    try {
      await createSwapOffer(offer);
      await fetchSwapOffers(); // Refresh the list
      notify.success('Swap offer created successfully');
    } catch (error) {
      console.error('Failed to create swap:', error);
      notify.error('Failed to create swap offer');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-50 to-white">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="w-6 h-6 text-yellow-500" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-500 to-yellow-600 bg-clip-text text-transparent">
                PerAlgo
              </h1>
            </div>
            <div className="flex items-center gap-6">
              <NetworkSwitch
                network={walletState.network}
                onNetworkChange={(network) => setWalletState(prev => ({ ...prev, network }))}
              />
              <button
                onClick={() => setIsHistoryOpen(true)}
                className="p-2 hover:bg-gray-100 rounded-full relative"
              >
                <Bell className="w-5 h-5 text-gray-600" />
                {notifications.length > 0 && (
                  <span className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 bg-yellow-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {notifications.length}
                  </span>
                )}
              </button>
              <ConnectButton
                isConnected={walletState.isConnected}
                address={walletState.address}
                onConnect={handleConnect}
                onDisconnect={handleDisconnect}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {walletState.isConnected ? (
          <>
            <div className="mb-12">
              <DonationCard onDonate={handleDonation} network={walletState.network} />
            </div>

            {/* Add Swap Section */}
            <div className="space-y-8 mb-12">
              <SwapCreate
                assets={assets}
                onCreateSwap={handleCreateSwap}
              />
              <SwapList
                offers={swapOffers}
                onAcceptSwap={acceptSwapOffer}
              />
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-8">Verified Assets</h2>
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading assets...</p>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <p className="text-red-600">{error}</p>
                  <button
                    onClick={fetchVerifiedAssets}
                    className="mt-4 px-4 py-2 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              ) : assets.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600">No verified assets found.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {assets.map((asset) => (
                    <AssetCard
                      key={asset.id}
                      asset={asset}
                      onOptIn={handleOptIn}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600">Connect your wallet to view assets and create swaps.</p>
          </div>
        )}
      </main>

      <TransactionProgress
        step={txProgress.step}
        totalSteps={txProgress.totalSteps}
        message={txProgress.message}
      />

      <NotificationHistory
        notifications={notifications}
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onClear={clearNotifications}
      />
    </div>
  );
}

export default App;