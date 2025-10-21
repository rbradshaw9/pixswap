import React from 'react';

const FeedPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Feed</h1>
        <p className="text-gray-600">Discover and share amazing content</p>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Coming Soon</h2>
        <p className="text-gray-600">
          The feed functionality is being built. Soon you'll be able to browse and interact with posts from the community.
        </p>
      </div>
    </div>
  );
};

export default FeedPage;