import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Youtube, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { youtubeService, YouTubeVideo } from '@/services/youtubeService';

const YouTubeConnectionTest = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<{
    tableExists: boolean | null;
    canFetchVideos: boolean | null;
    videoCount: number;
    videos: YouTubeVideo[];
    error: string | null;
  }>({
    tableExists: null,
    canFetchVideos: null,
    videoCount: 0,
    videos: [],
    error: null
  });

  const runTest = async () => {
    setIsLoading(true);
    setTestResults({
      tableExists: null,
      canFetchVideos: null,
      videoCount: 0,
      videos: [],
      error: null
    });

    try {
      // Test 1: Initialize service (creates table if needed)
      console.log('🧪 Testing YouTube service initialization...');
      await youtubeService.initialize();
      setTestResults(prev => ({ ...prev, tableExists: true }));

      // Test 2: Fetch videos
      console.log('🧪 Testing video fetching...');
      const videos = await youtubeService.getAllVideos();
      setTestResults(prev => ({ 
        ...prev, 
        canFetchVideos: true,
        videoCount: videos.length,
        videos: videos
      }));

      console.log('✅ YouTube connection test completed successfully');
    } catch (error) {
      console.error('❌ YouTube connection test failed:', error);
      setTestResults(prev => ({ 
        ...prev, 
        tableExists: false,
        canFetchVideos: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const addTestVideo = async () => {
    try {
      const testVideo = {
        title: "Test Video - Pizza Making",
        description: "A test video showing how we make our delicious pizzas",
        youtube_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        thumbnail_url: "",
        is_active: true,
        sort_order: 1
      };

      const result = await youtubeService.addVideo(testVideo);
      if (result) {
        console.log('✅ Test video added successfully');
        await runTest(); // Refresh the test results
      } else {
        console.error('❌ Failed to add test video');
      }
    } catch (error) {
      console.error('❌ Error adding test video:', error);
    }
  };

  useEffect(() => {
    runTest();
  }, []);

  const StatusIcon = ({ status }: { status: boolean | null }) => {
    if (status === null) return <Loader2 className="w-4 h-4 animate-spin text-gray-400" />;
    return status ? 
      <CheckCircle className="w-4 h-4 text-green-500" /> : 
      <XCircle className="w-4 h-4 text-red-500" />;
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Youtube className="mr-2 text-red-600" />
          YouTube Connection Test
        </CardTitle>
        <CardDescription>
          Test the connection between admin panel and frontend YouTube functionality
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Test Results */}
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="font-medium">Database Table Exists</span>
            <StatusIcon status={testResults.tableExists} />
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="font-medium">Can Fetch Videos</span>
            <StatusIcon status={testResults.canFetchVideos} />
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="font-medium">Video Count</span>
            <span className="font-bold text-blue-600">{testResults.videoCount}</span>
          </div>
        </div>

        {/* Error Display */}
        {testResults.error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <h4 className="font-medium text-red-800 mb-2">Error Details:</h4>
            <p className="text-red-600 text-sm">{testResults.error}</p>
          </div>
        )}

        {/* Videos List */}
        {testResults.videos.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-gray-800">Found Videos:</h4>
            {testResults.videos.map((video) => (
              <div key={video.id} className="p-3 border border-gray-200 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h5 className="font-medium text-gray-800">{video.title}</h5>
                    <p className="text-sm text-gray-600 mt-1">{video.description}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      URL: {video.youtube_url}
                    </p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      <span>Active: {video.is_active ? '✅' : '❌'}</span>
                      <span>Order: {video.sort_order}</span>
                      <span>Created: {new Date(video.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <Button 
            onClick={runTest} 
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                Testing...
              </>
            ) : (
              'Run Test Again'
            )}
          </Button>
          
          {testResults.videoCount === 0 && testResults.canFetchVideos && (
            <Button 
              onClick={addTestVideo}
              variant="outline"
              className="border-green-600 text-green-600 hover:bg-green-50"
            >
              Add Test Video
            </Button>
          )}
        </div>

        {/* Instructions */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">How to Test:</h4>
          <ol className="text-blue-700 text-sm space-y-1 list-decimal list-inside">
            <li>Go to Admin Panel → Video YouTube section</li>
            <li>Add a new YouTube video with title, description, and URL</li>
            <li>Make sure "Active" is checked</li>
            <li>Save the video</li>
            <li>Come back here and click "Run Test Again"</li>
            <li>Check the frontend YouTube section to see if it displays</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};

export default YouTubeConnectionTest;
