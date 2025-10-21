import React from 'react';

const ChatPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Chat</h1>
        <p className="text-gray-600">Connect with others in real-time</p>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Coming Soon</h2>
        <p className="text-gray-600">
          Real-time chat functionality is being built. Soon you'll be able to have private conversations and join group chats.
        </p>
      </div>
    </div>
  );
};

export default ChatPage;