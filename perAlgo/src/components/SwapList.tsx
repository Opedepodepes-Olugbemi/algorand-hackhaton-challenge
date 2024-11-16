import React, { useState } from 'react';
import type { SwapOffer } from '../types/swap';
import { ArrowRight, Clock } from 'lucide-react';

interface SwapListProps {
  offers: SwapOffer[];
  onAcceptSwap: (offerId: string) => Promise<void>;
}

export const SwapList: React.FC<SwapListProps> = ({ offers, onAcceptSwap }) => {
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  const handleAccept = async (offerId: string) => {
    setAcceptingId(offerId);
    try {
      await onAcceptSwap(offerId);
    } finally {
      setAcceptingId(null);
    }
  };

  const formatTimeLeft = (expiresAt: Date) => {
    const now = new Date();
    const diff = expiresAt.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-6">Available Swaps</h2>
      
      {offers.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No swap offers available
        </div>
      ) : (
        <div className="space-y-4">
          {offers.map((offer) => (
            <div
              key={offer.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Clock className="w-4 h-4" />
                  <span>Expires in {formatTimeLeft(offer.expiresAt)}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    {offer.assetToSend.amount.toLocaleString()} {offer.assetToSend.unitName}
                  </p>
                  <p className="text-sm text-gray-500">{offer.assetToSend.name}</p>
                </div>
                
                <ArrowRight className="w-5 h-5 text-gray-400 mx-4" />
                
                <div className="flex-1 text-right">
                  <p className="font-medium text-gray-900">
                    {offer.assetToReceive.amount.toLocaleString()} {offer.assetToReceive.unitName}
                  </p>
                  <p className="text-sm text-gray-500">{offer.assetToReceive.name}</p>
                </div>
              </div>

              <button
                onClick={() => handleAccept(offer.id)}
                disabled={acceptingId === offer.id || offer.status !== 'open'}
                className={`mt-4 w-full py-2 px-4 rounded-lg text-white font-medium transition-colors ${
                  acceptingId === offer.id
                    ? 'bg-gray-400 cursor-not-allowed'
                    : offer.status !== 'open'
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-yellow-500 hover:bg-yellow-600'
                }`}
              >
                {acceptingId === offer.id ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                    Accepting Swap...
                  </div>
                ) : offer.status !== 'open' ? (
                  'Swap Unavailable'
                ) : (
                  'Accept Swap'
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}; 