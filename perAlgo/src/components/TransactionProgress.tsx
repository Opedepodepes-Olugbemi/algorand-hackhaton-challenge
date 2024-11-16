import React from 'react';

interface TransactionProgressProps {
  step: number;
  totalSteps: number;
  message: string;
}

export const TransactionProgress: React.FC<TransactionProgressProps> = ({ step, totalSteps, message }) => {
  const progress = (step / totalSteps) * 100;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg p-4 transform transition-transform duration-300" 
         style={{ transform: step === 0 ? 'translateY(100%)' : 'translateY(0)' }}>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">{message}</span>
          <span className="text-sm text-gray-500">{`Step ${step} of ${totalSteps}`}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-yellow-500 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}; 