import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';

const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-purple-700">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold text-white mb-6">
            Pix<span className="text-yellow-300">Swap</span>
          </h1>
          <p className="text-xl text-gray-200 mb-8 max-w-2xl mx-auto">
            A privacy-first creative media sharing platform. Share, chat, and interact with 
            short-lived photos and videos in a fun and safe way.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup">
              <Button size="lg" className="bg-white text-primary-600 hover:bg-gray-100">
                Get Started
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-primary-600">
                Sign In
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card className="bg-white/10 border-white/20 text-white">
            <CardHeader>
              <CardTitle className="text-white">🔒 Privacy First</CardTitle>
              <CardDescription className="text-gray-200">
                Your content automatically expires. Share without worry about permanent storage.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white/10 border-white/20 text-white">
            <CardHeader>
              <CardTitle className="text-white">🔄 Random Swaps</CardTitle>
              <CardDescription className="text-gray-200">
                Exchange photos with random users in our unique photo roulette experience.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white/10 border-white/20 text-white">
            <CardHeader>
              <CardTitle className="text-white">💬 Real-time Chat</CardTitle>
              <CardDescription className="text-gray-200">
                Connect with others through instant messaging and group conversations.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white/10 border-white/20 text-white">
            <CardHeader>
              <CardTitle className="text-white">📱 Mobile First</CardTitle>
              <CardDescription className="text-gray-200">
                Optimized for mobile with a beautiful, responsive design.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white/10 border-white/20 text-white">
            <CardHeader>
              <CardTitle className="text-white">🛡️ Safe Community</CardTitle>
              <CardDescription className="text-gray-200">
                Built-in moderation and reporting system to keep the community safe.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white/10 border-white/20 text-white">
            <CardHeader>
              <CardTitle className="text-white">⚡ Lightning Fast</CardTitle>
              <CardDescription className="text-gray-200">
                Built with modern technologies for the best user experience.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default HomePage;