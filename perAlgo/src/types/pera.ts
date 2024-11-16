export interface VerifiedAsset {
  id: number;
  name: string;
  unit_name: string;
  verified: boolean;
  logo: string;
  total_supply: number;
  decimals: number;
  creator_address?: string;
}

export interface WalletState {
  address: string | null;
  network: 'MainNet' | 'TestNet';
  isConnected: boolean;
}