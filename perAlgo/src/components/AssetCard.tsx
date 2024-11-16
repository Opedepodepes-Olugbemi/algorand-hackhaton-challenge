import React, { useState } from 'react';
import type { VerifiedAsset } from '../types/pera';

interface AssetCardProps {
  asset: VerifiedAsset;
  onOptIn: (assetId: number) => Promise<void>;
}

export const AssetCard: React.FC<AssetCardProps> = ({ asset, onOptIn }) => {
  const [imageError, setImageError] = useState(false);
  const [isOptingIn, setIsOptingIn] = useState(false);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.log('Image failed to load:', asset.logo);
    setImageError(true);
    e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIGZpbGw9IiNFNUU3RUIiLz48cGF0aCBkPSJNMjQgMjhDMjYuMjA5MSAyOCAyOCAyNi4yMDkxIDI4IDI0QzI4IDIxLjc5MDkgMjYuMjA5MSAyMCAyNCAyMEMyMS43OTA5IDIwIDIwIDIxLjc5MDkgMjAgMjRDMjAgMjYuMjA5MSAyMS43OTA5IDI4IDI0IDI4WiIgZmlsbD0iIzlDQTNBRiIvPjwvc3ZnPg==';
  };

  const handleOptIn = async () => {
    setIsOptingIn(true);
    try {
      await onOptIn(asset.id);
    } finally {
      setIsOptingIn(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow">
      <div className="p-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-gray-100">
            <img
              src={asset.logo}
              alt={asset.name}
              className="w-full h-full object-contain"
              onError={handleImageError}
              onLoad={() => console.log('Image loaded successfully:', asset.logo)}
              style={{ 
                backgroundColor: imageError ? '#E5E7EB' : 'transparent',
                mixBlendMode: 'multiply'
              }}
            />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">{asset.name}</h3>
            <p className="text-sm text-gray-500">Unit: {asset.unit_name}</p>
          </div>
        </div>
        
        <div className="mt-4">
          <p className="text-sm text-gray-600 mb-2">
            ID: {asset.id}
          </p>
          {asset.total_supply && (
            <p className="text-sm text-gray-600">
              Supply: {Number(asset.total_supply).toLocaleString()}
            </p>
          )}
        </div>

        <button
          onClick={handleOptIn}
          disabled={isOptingIn}
          className={`mt-4 w-full px-4 py-2 rounded-lg transition-colors ${
            isOptingIn 
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-yellow-500 hover:bg-yellow-600 text-white'
          }`}
        >
          {isOptingIn ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
              Opting In...
            </div>
          ) : (
            'Opt In'
          )}
        </button>
      </div>
    </div>
  );
};