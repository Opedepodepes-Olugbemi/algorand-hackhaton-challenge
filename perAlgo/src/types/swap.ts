export interface SwapOffer {
  id: string;
  creator: string;
  assetToSend: {
    id: number;
    amount: number;
    name: string;
    unitName: string;
  };
  assetToReceive: {
    id: number;
    amount: number;
    name: string;
    unitName: string;
  };
  status: 'open' | 'completed' | 'cancelled';
  createdAt: Date;
  expiresAt: Date;
} 