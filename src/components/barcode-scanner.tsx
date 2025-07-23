import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface BarcodeScannerProps {
  onBarcodeScanned: (barcode: string) => void;
  isScanning: boolean;
  setIsScanning: (scanning: boolean) => void;
  className?: string;
}

export default function BarcodeScanner({ 
  onBarcodeScanned, 
  isScanning, 
  setIsScanning, 
  className = '' 
}: BarcodeScannerProps) {
  const [manualBarcode, setManualBarcode] = useState('');
  const [cameraStatus, setCameraStatus] = useState<'idle' | 'loading' | 'active' | 'error'>('idle');
  const [lastScannedBarcode, setLastScannedBarcode] = useState<string>('');
  const [physicalScannerConnected, setPhysicalScannerConnected] = useState(false);
  const [scanHistory, setScanHistory] = useState<Array<{barcode: string, timestamp: Date, method: string}>>([]);
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const codeReaderRef = useRef<any>(null);
  const physicalScanBufferRef = useRef<string>('');
  const physicalScanTimeoutRef = useRef<NodeJS.Timeout>();

  // Import ZXing library dynamically
  const initializeScanner = async () => {
    if (typeof window === 'undefined') return null;
    
    try {
      // Load ZXing library if not already loaded
      if (!(window as any).ZXing) {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/@zxing/browser@latest/dist/zxing-browser.min.js';
        script.async = true;
        
        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
        
        // Wait for ZXing to be available
        let retries = 0;
        while (!(window as any).ZXing && retries < 50) {
          await new Promise(resolve => setTimeout(resolve, 100));
          retries++;
        }
      }
      
      return (window as any).ZXing?.BrowserMultiFormatReader;
    } catch (error) {
      console.error('Failed to load barcode scanner:', error);
      return null;
    }
  };

  // Handle camera barcode scanning
  const startCameraScanning = async () => {
    setCameraStatus('loading');
    setIsScanning(true);
    
    try {
      const BrowserMultiFormatReader = await initializeScanner();
      if (!BrowserMultiFormatReader) {
        throw new Error('Barcode scanner library failed to load');
      }

      const codeReader = new BrowserMultiFormatReader();
      codeReaderRef.current = codeReader;
      
      const videoInputDevices = await BrowserMultiFormatReader.listVideoInputDevices();
      
      if (videoInputDevices.length === 0) {
        throw new Error('No camera found. Please connect a camera and grant permissions.');
      }
      
      const selectedDeviceId = videoInputDevices[0].deviceId;
      
      codeReader.decodeFromVideoDevice(selectedDeviceId, videoRef.current!, (result: any, err: any) => {
        if (result) {
          const barcode = result.getText();
          handleBarcodeDetected(barcode, 'camera');
          setCameraStatus('active');
        }
        
        if (err && !(err instanceof (window as any).ZXing.NotFoundException)) {
          console.error('Scanner error:', err);
        }
      });
      
      setCameraStatus('active');
      
    } catch (error) {
      console.error('Camera scanning error:', error);
      setCameraStatus('error');
      setIsScanning(false);
      alert(`Camera Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const stopCameraScanning = () => {
    if (codeReaderRef.current) {
      codeReaderRef.current.reset();
      codeReaderRef.current = null;
    }
    setCameraStatus('idle');
    setIsScanning(false);
  };

  // Handle manual barcode input
  const handleManualSubmit = () => {
    if (!manualBarcode.trim()) return;
    
    handleBarcodeDetected(manualBarcode.trim(), 'manual');
    setManualBarcode('');
  };

  // Handle barcode detection from any source
  const handleBarcodeDetected = (barcode: string, method: string) => {
    setLastScannedBarcode(barcode);
    setScanHistory(prev => [...prev.slice(-4), { barcode, timestamp: new Date(), method }]);
    onBarcodeScanned(barcode);
  };

  // Physical scanner support (USB/Bluetooth HID scanners)
  useEffect(() => {
    const handlePhysicalScannerInput = (e: KeyboardEvent) => {
      // Only process if no input is focused or if focused on our barcode input
      const activeElement = document.activeElement;
      const isOurInput = activeElement?.id === 'physical-scanner-input';
      const isNoInputFocused = !activeElement || activeElement.tagName === 'BODY';
      
      if (!isOurInput && !isNoInputFocused) return;
      
      // Clear existing timeout
      if (physicalScanTimeoutRef.current) {
        clearTimeout(physicalScanTimeoutRef.current);
      }
      
      if (e.key === 'Enter') {
        // Physical scanners typically send Enter after barcode
        if (physicalScanBufferRef.current.length > 0) {
          e.preventDefault();
          handleBarcodeDetected(physicalScanBufferRef.current, 'physical');
          physicalScanBufferRef.current = '';
          setPhysicalScannerConnected(true);
        }
      } else if (e.key.length === 1) {
        // Regular character - add to buffer
        physicalScanBufferRef.current += e.key;
        
        // Auto-clear buffer after 100ms of no input (typical scanner speed)
        physicalScanTimeoutRef.current = setTimeout(() => {
          physicalScanBufferRef.current = '';
        }, 100);
      }
    };

    document.addEventListener('keydown', handlePhysicalScannerInput);
    
    return () => {
      document.removeEventListener('keydown', handlePhysicalScannerInput);
      if (physicalScanTimeoutRef.current) {
        clearTimeout(physicalScanTimeoutRef.current);
      }
    };
  }, []);

  // Handle manual input key press
  const handleManualKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleManualSubmit();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCameraScanning();
    };
  }, []);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          📱 Barcode Scanner
          {physicalScannerConnected && (
            <Badge variant="secondary" className="text-xs">
              Physical Scanner Detected
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Camera Scanner */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <Button 
              onClick={startCameraScanning} 
              disabled={isScanning}
              variant={cameraStatus === 'active' ? 'secondary' : 'default'}
              size="sm"
            >
              {cameraStatus === 'loading' ? '📷 Starting...' : 
               cameraStatus === 'active' ? '📷 Camera Active' : 
               '📷 Start Camera'}
            </Button>
            <Button 
              onClick={stopCameraScanning} 
              disabled={!isScanning}
              variant="outline"
              size="sm"
            >
              ⏹️ Stop
            </Button>
          </div>
          
          {isScanning && (
            <video 
              ref={videoRef} 
              autoPlay 
              muted 
              className="w-full max-w-sm h-32 bg-black border rounded-lg"
            />
          )}
          
          {cameraStatus === 'error' && (
            <p className="text-sm text-red-600">
              ❌ Camera access failed. Check permissions.
            </p>
          )}
        </div>

        {/* Manual Input */}
        <div className="space-y-2">
          <Label htmlFor="manual-barcode">Manual Entry:</Label>
          <div className="flex gap-2">
            <Input
              id="manual-barcode"
              value={manualBarcode}
              onChange={(e) => setManualBarcode(e.target.value)}
              onKeyPress={handleManualKeyPress}
              placeholder="Type or scan barcode here"
              className="flex-1"
            />
            <Button 
              onClick={handleManualSubmit}
              size="sm"
              variant="outline"
              disabled={!manualBarcode.trim()}
            >
              ✓ Add
            </Button>
          </div>
        </div>

        {/* Physical Scanner Input Field */}
        <div className="space-y-2">
          <Label htmlFor="physical-scanner-input" className="text-sm text-gray-600">
            Physical Scanner (focus here for USB/Bluetooth scanners):
          </Label>
          <Input
            id="physical-scanner-input"
            placeholder="Focus here and scan with physical device"
            className="border-dashed border-2 text-xs"
            onFocus={() => setPhysicalScannerConnected(false)}
          />
          <p className="text-xs text-gray-500">
            💡 USB/Bluetooth scanners: Click above, then scan. Most scanners work as keyboards.
          </p>
        </div>

        {/* Last Scanned */}
        {lastScannedBarcode && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <h4 className="text-sm font-medium text-green-800">✅ Last Scanned:</h4>
            <code className="text-sm text-green-700">{lastScannedBarcode}</code>
          </div>
        )}

        {/* Scan History */}
        {scanHistory.length > 0 && (
          <div className="space-y-1">
            <h4 className="text-sm font-medium">Recent Scans:</h4>
            <div className="max-h-20 overflow-y-auto space-y-1">
              {scanHistory.map((scan, index) => (
                <div key={index} className="text-xs bg-gray-50 p-1 rounded flex justify-between">
                  <code>{scan.barcode}</code>
                  <span className="text-gray-500">
                    {scan.method} • {scan.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
