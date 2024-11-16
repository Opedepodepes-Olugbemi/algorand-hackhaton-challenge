import React from 'react';
import { Network } from 'lucide-react';

interface NetworkSwitchProps {
  network: 'MainNet' | 'TestNet';
  onNetworkChange: (network: 'MainNet' | 'TestNet') => void;
}

export function NetworkSwitch({ network, onNetworkChange }: NetworkSwitchProps) {
  return (
    <div className="flex items-center gap-2">
      <Network className="w-5 h-5 text-yellow-500" />
      <select
        value={network}
        onChange={(e) => onNetworkChange(e.target.value as 'MainNet' | 'TestNet')}
        className="bg-yellow-50 border border-yellow-100 rounded-xl px-4 py-1.5 text-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
        aria-label="Select network"
      >
        <option value="MainNet">MainNet</option>
        <option value="TestNet">TestNet</option>
      </select>
    </div>
  );
}