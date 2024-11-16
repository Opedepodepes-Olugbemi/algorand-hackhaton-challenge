import React, { useState } from 'react';
import type { VerifiedAsset } from '../types/pera';
import type { SwapOffer } from '../types/swap';

interface SwapCreateProps {
  assets: VerifiedAsset[];
  onCreateSwap: (offer: Omit<SwapOffer, 'id' | 'status' | 'createdAt'>) => Promise<void>;
}

export const SwapCreate: React.FC<SwapCreateProps> = ({ assets, onCreateSwap }) => {
  const [sendAsset, setSendAsset] = useState<number | ''>('');
  const [receiveAsset, setReceiveAsset] = useState<number | ''>('');
  const [sendAmount, setSendAmount] = useState<string>('');
  const [receiveAmount, setReceiveAmount] = useState<string>('');
  const [expiryHours, setExpiryHours] = useState<string>('24');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sendAsset || !receiveAsset || !sendAmount || !receiveAmount) return;

    setIsSubmitting(true);
    try {
      const sendAssetInfo = assets.find(a => a.id === sendAsset);
      const receiveAssetInfo = assets.find(a => a.id === receiveAsset);
      
      if (!sendAssetInfo || !receiveAssetInfo) {
        throw new Error('Invalid asset selection');
      }

      const expiryDate = new Date();
      expiryDate.setHours(expiryDate.getHours() + Number(expiryHours));

      await onCreateSwap({
        creator: '', // Will be set by the backend
        assetToSend: {
          id: sendAsset as number,
          amount: Number(sendAmount),
          name: sendAssetInfo.name,
          unitName: sendAssetInfo.unit_name
        },
        assetToReceive: {
          id: receiveAsset as number,
          amount: Number(receiveAmount),
          name: receiveAssetInfo.name,
          unitName: receiveAssetInfo.unit_name
        },
        expiresAt: expiryDate
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-6">Create Swap Offer</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Send Asset Section */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-700">You Send</h3>
            <select
              value={sendAsset}
              onChange={(e) => setSendAsset(Number(e.target.value) || '')}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
              aria-label="Select asset to send"
              title="Select asset to send"
            >
              <option value="">Select Asset</option>
              {assets.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.name} ({asset.unit_name})
                </option>
              ))}
            </select>
            <input
              type="number"
              value={sendAmount}
              onChange={(e) => setSendAmount(e.target.value)}
              placeholder="Amount to send"
              title="Amount to send"
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
              min="0"
              step="any"
            />
          </div>

          {/* Receive Asset Section */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-700">You Receive</h3>
            <select
              value={receiveAsset}
              onChange={(e) => setReceiveAsset(Number(e.target.value) || '')}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
              aria-label="Select asset to receive"
              title="Select asset to receive"
            >
              <option value="">Select Asset</option>
              {assets.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.name} ({asset.unit_name})
                </option>
              ))}
            </select>
            <input
              type="number"
              value={receiveAmount}
              onChange={(e) => setReceiveAmount(e.target.value)}
              placeholder="Amount to receive"
              title="Amount to receive"
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
              min="0"
              step="any"
            />
          </div>
        </div>

        {/* Expiry Time */}
        <div>
          <label htmlFor="expiryHours" className="block text-sm font-medium text-gray-700">
            Expires in (hours)
          </label>
          <input
            id="expiryHours"
            type="number"
            value={expiryHours}
            onChange={(e) => setExpiryHours(e.target.value)}
            className="mt-1 w-full rounded-lg border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
            min="1"
            max="168"
            title="Expiry time in hours"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !sendAsset || !receiveAsset || !sendAmount || !receiveAmount}
          className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-colors ${
            isSubmitting || !sendAsset || !receiveAsset || !sendAmount || !receiveAmount
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-yellow-500 hover:bg-yellow-600'
          }`}
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
              Creating Swap...
            </div>
          ) : (
            'Create Swap'
          )}
        </button>
      </form>
    </div>
  );
};