import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Volume2, VolumeX, Smartphone, AlertCircle } from 'lucide-react';
import iosAudioFix from '@/utils/iosAudioFix';

const IOSAudioTest: React.FC = () => {
  const [audioStatus, setAudioStatus] = useState(iosAudioFix.getStatus());
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLooping, setIsLooping] = useState(false);
  const [stopLoopFunction, setStopLoopFunction] = useState<(() => void) | null>(null);

  useEffect(() => {
    // Update status every second
    const interval = setInterval(() => {
      setAudioStatus(iosAudioFix.getStatus());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const addTestResult = (result: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setTestResults(prev => [`[${timestamp}] ${result}`, ...prev.slice(0, 9)]);
  };

  const testSingleBeep = async () => {
    addTestResult('🧪 Testing single beep...');
    try {
      const success = await iosAudioFix.playNotificationSound();
      addTestResult(success ? '✅ Single beep successful' : '❌ Single beep failed');
    } catch (error) {
      addTestResult(`❌ Single beep error: ${error}`);
    }
  };

  const testLoopingSound = async () => {
    if (isLooping) {
      // Stop looping
      if (stopLoopFunction) {
        stopLoopFunction();
        setStopLoopFunction(null);
      }
      setIsLooping(false);
      addTestResult('🔇 Stopped looping sound');
    } else {
      // Start looping
      addTestResult('🔊 Starting looping sound...');
      try {
        const stopFunction = await iosAudioFix.playLoopingSound();
        setStopLoopFunction(() => stopFunction);
        setIsLooping(true);
        addTestResult('✅ Looping sound started');
      } catch (error) {
        addTestResult(`❌ Looping sound error: ${error}`);
      }
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-5 w-5" />
          iOS Audio Test Panel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Device Status */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <h3 className="font-semibold">Device Detection</h3>
            <Badge variant={audioStatus.isIOS ? "default" : "secondary"}>
              {audioStatus.isIOS ? "🍎 iOS Device" : "📱 Non-iOS Device"}
            </Badge>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold">Audio Status</h3>
            <Badge variant={audioStatus.isInitialized ? "default" : "destructive"}>
              {audioStatus.isInitialized ? "✅ Initialized" : "❌ Not Initialized"}
            </Badge>
          </div>
        </div>

        {/* User Interaction Status */}
        <div className="space-y-2">
          <h3 className="font-semibold">User Interaction</h3>
          <Badge variant={audioStatus.userHasInteracted ? "default" : "outline"}>
            {audioStatus.userHasInteracted ? "✅ User Interacted" : "⚠️ No Interaction Yet"}
          </Badge>
          {!audioStatus.userHasInteracted && (
            <p className="text-sm text-gray-600">
              <AlertCircle className="h-4 w-4 inline mr-1" />
              iOS requires user interaction before playing audio. Click any button to enable.
            </p>
          )}
        </div>

        {/* Test Buttons */}
        <div className="space-y-3">
          <h3 className="font-semibold">Audio Tests</h3>
          <div className="flex gap-2 flex-wrap">
            <Button onClick={testSingleBeep} variant="outline">
              <Volume2 className="h-4 w-4 mr-2" />
              Test Single Beep
            </Button>
            <Button
              onClick={testLoopingSound}
              variant={isLooping ? "destructive" : "default"}
            >
              {isLooping ? (
                <>
                  <VolumeX className="h-4 w-4 mr-2" />
                  Stop Looping
                </>
              ) : (
                <>
                  <Volume2 className="h-4 w-4 mr-2" />
                  Test Looping
                </>
              )}
            </Button>
            <Button onClick={clearResults} variant="ghost" size="sm">
              Clear Results
            </Button>
          </div>
        </div>

        {/* Test Results */}
        <div className="space-y-2">
          <h3 className="font-semibold">Test Results</h3>
          <div className="bg-gray-50 rounded-lg p-3 max-h-48 overflow-y-auto">
            {testResults.length === 0 ? (
              <p className="text-gray-500 text-sm">No test results yet. Click a test button above.</p>
            ) : (
              <div className="space-y-1">
                {testResults.map((result, index) => (
                  <div key={index} className="text-sm font-mono">
                    {result}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Debug Info */}
        <details className="space-y-2">
          <summary className="font-semibold cursor-pointer">Debug Information</summary>
          <div className="bg-gray-50 rounded-lg p-3">
            <pre className="text-xs overflow-x-auto">
              {JSON.stringify({
                userAgent: navigator.userAgent,
                platform: navigator.platform,
                audioStatus,
                isLooping
              }, null, 2)}
            </pre>
          </div>
        </details>
      </CardContent>
    </Card>
  );
};

export default IOSAudioTest;