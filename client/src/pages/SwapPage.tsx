import React from 'react';

const SwapPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Photo Swap</h1>
        <p className="text-gray-600">Exchange photos with random users</p>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Coming Soon</h2>
        <p className="text-gray-600">
          The photo roulette feature is being built. Soon you'll be able to participate in random photo exchanges with other users.
        </p>
      </div>
    </div>
  );
};

export default SwapPage;