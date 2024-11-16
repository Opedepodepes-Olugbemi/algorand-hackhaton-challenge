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

// Your wallet address for donations
const DONATION_ADDRESSES = {
  MainNet: 'YJ5EFJPM3TYIP23SOOJWVAUVMKBJVGIZCNNIIZO652ZUSSTMGVIGMLC5YM',
  TestNet: 'YJ5EFJPM3TYIP23SOOJWVAUVMKBJVGIZCNNIIZO652ZUSSTMGVIGMLC5YM'
};

// Remove ASSET_METADATA and update ASSET_ICONS
const ASSET_ICONS = {
  'USDC': 'https://s2.coinmarketcap.com/static/img/coins/64x64/3408.png',
  'USDt': 'https://s2.coinmarketcap.com/static/img/coins/64x64/825.png',
  'USDT': 'https://s2.coinmarketcap.com/static/img/coins/64x64/825.png',
  'PLANET': 'https://s2.coinmarketcap.com/static/img/coins/64x64/10664.png',
  'DEFLY': 'https://s2.coinmarketcap.com/static/img/coins/64x64/19133.png',
  'XSOL': 'https://s2.coinmarketcap.com/static/img/coins/64x64/5426.png',
  'goETH': 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png',
  'ALGO': 'https://s2.coinmarketcap.com/static/img/coins/64x64/4030.png',
  'OPUL': 'https://s2.coinmarketcap.com/static/img/coins/64x64/11955.png',
  'GARD': 'https://s2.coinmarketcap.com/static/img/coins/64x64/9417.png',
  'GEMS': 'https://s2.coinmarketcap.com/static/img/coins/64x64/13753.png',
  'goBTC': 'https://s2.coinmarketcap.com/static/img/coins/64x64/1.png',
} as const;

// Fix the AccountInfo interface to match Algorand's response type
interface AccountInfo {
  amount: number;
  'min-balance': number;
  'amount-without-pending-rewards': number;
  'pending-rewards': number;
  'reward-base': number;
  rewards: number;
  round: number;
  status: string;
  'total-apps-opted-in': number;
  'total-assets-opted-in': number;
  'total-created-apps': number;
  'total-created-assets': number;
  assets: {
    amount: number;
    'asset-id': number;
    creator: string;
    'is-frozen': boolean;
  }[];
}

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
  const [balance, setBalance] = useState<AccountInfo | null>(null);

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
  }, []);

  useEffect(() => {
    if (walletState.isConnected) {
      fetchVerifiedAssets();
    } else {
      setAssets([]);
    }
  }, [walletState.isConnected, walletState.network]);

  useEffect(() => {
    setNotificationChangeHandler((newNotifications) => {
      setNotifications([...newNotifications]);
    });
  }, []);

  useEffect(() => {
    if (walletState.isConnected && walletState.address) {
      fetchBalance(walletState.address);
    } else {
      setBalance(null);
    }
  }, [walletState.isConnected, walletState.address, walletState.network]);

  const fetchVerifiedAssets = async () => {
    setLoading(true);
    setError(null);
    try {
      const indexer = NETWORKS[walletState.network].indexer;
      
      // Get popular ASAs
      const popularAssetIds = [
        31566704,  // USDC
        312769,    // USDT
        27165954,  // PLANET
        226701642, // DEFLY
        283820866, // XSOL
        470842789, // ALGO/USDC
        386192725  // goETH
      ];

      const assetPromises = popularAssetIds.map(async (assetId) => {
        try {
          const assetInfo = await indexer.lookupAssetByID(assetId).do();
          const params = assetInfo.asset.params;
          const unitName = params['unit-name'] || '';

          // Get logo from our mapping
          const logo = ASSET_ICONS[unitName as keyof typeof ASSET_ICONS] || '';

          return {
            id: assetId,
            name: params.name || '',
            unit_name: unitName,
            verified: true,
            logo,
            total_supply: params.total,
            decimals: params.decimals,
            creator_address: params.creator
          } as VerifiedAsset;
        } catch (error) {
          console.error(`Error fetching asset ${assetId}:`, error);
          return null;
        }
      });

      const assetResults = (await Promise.all(assetPromises))
        .filter((asset): asset is VerifiedAsset => 
          asset !== null && 
          asset.logo !== '' // Only include assets with logos
        )
        .sort((a, b) => a.name.localeCompare(b.name));

      setAssets(assetResults);
    } catch (error) {
      console.error('Asset fetch error:', error);
      setError('Failed to load verified assets. Please try again later.');
      setAssets([]);
    } finally {
      setLoading(false);
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

  // Update the fetchBalance function to properly type the response
  const fetchBalance = async (address: string) => {
    try {
      const algodClient = NETWORKS[walletState.network].algod;
      const accountInfo = await algodClient.accountInformation(address).do() as AccountInfo;
      setBalance(accountInfo);
    } catch (error) {
      console.error('Error fetching balance:', error);
      notify.error('Failed to fetch wallet balance');
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
              {balance && (
                <div className="px-4 py-2 bg-yellow-50 rounded-xl">
                  <p className="text-sm font-medium text-yellow-900">
                    {(balance['amount-without-pending-rewards'] / 1e6).toLocaleString()} ALGO
                  </p>
                  {balance['pending-rewards'] > 0 && (
                    <p className="text-xs text-yellow-600">
                      +{(balance['pending-rewards'] / 1e6).toLocaleString()} pending
                    </p>
                  )}
                </div>
              )}
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
            <p className="text-gray-600">Connect your wallet to view verified assets.</p>
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