import React, { useState } from 'react';
import { Heart, Coins } from 'lucide-react';

interface DonationCardProps {
  onDonate: (amount: number) => void;
  network: 'MainNet' | 'TestNet';
}

const PRESET_AMOUNTS = [1, 5, 10, 25];

export function DonationCard({ onDonate, network }: DonationCardProps) {
  const [customAmount, setCustomAmount] = useState<string>('');

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
      <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Heart className="w-8 h-8 text-white" />
            <h2 className="text-2xl font-bold text-white">Support PerAlgo</h2>
          </div>
          <span className="px-3 py-1 bg-yellow-600/20 text-white rounded-lg text-sm font-medium">
            {network}
          </span>
        </div>
        <p className="mt-2 text-yellow-50">Your contribution helps us maintain and improve the platform</p>
      </div>
      
      <div className="p-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {PRESET_AMOUNTS.map((amount) => (
            <button
              key={amount}
              onClick={() => onDonate(amount)}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-yellow-50 hover:bg-yellow-100 transition-colors"
            >
              <Coins className="w-4 h-4 text-yellow-600" />
              <span className="font-medium text-yellow-900">{amount} ALGO</span>
            </button>
          ))}
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <input
              type="number"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              placeholder="Custom amount"
              min="0"
              step="0.1"
              className="w-full px-4 py-3 rounded-xl border-2 border-yellow-100 focus:border-yellow-500 focus:ring-yellow-500"
            />
          </div>
          <button
            onClick={() => {
              const amount = parseFloat(customAmount);
              if (amount > 0) {
                onDonate(amount);
                setCustomAmount('');
              }
            }}
            disabled={!customAmount || parseFloat(customAmount) <= 0}
            className="px-6 py-3 rounded-xl bg-yellow-500 hover:bg-yellow-600 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Donate
          </button>
        </div>
      </div>
    </div>
  );
}