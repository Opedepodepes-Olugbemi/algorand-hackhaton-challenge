import React from 'react';
import { Wallet } from 'lucide-react';

interface ConnectButtonProps {
  isConnected: boolean;
  address: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
}

export function ConnectButton({ isConnected, address, onConnect, onDisconnect }: ConnectButtonProps) {
  if (!isConnected) {
    return (
      <button
        onClick={onConnect}
        className="flex items-center gap-2 bg-yellow-500 text-white px-4 py-2 rounded-xl hover:bg-yellow-600 transition-colors"
      >
        <Wallet className="w-5 h-5" />
        Connect with Pera
      </button>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <code className="bg-yellow-50 px-4 py-1.5 rounded-xl text-sm text-yellow-900 border border-yellow-100">
        {address?.slice(0, 6)}...{address?.slice(-4)}
      </code>
      <button
        onClick={onDisconnect}
        className="text-red-600 hover:text-red-700 text-sm font-medium"
      >
        Disconnect
      </button>
    </div>
  );
}