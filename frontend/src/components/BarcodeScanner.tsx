import React, { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';

interface BarcodeScannerProps {
  onScanSuccess: (barcode: string) => void;
  onClose: () => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScanSuccess, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [manualBarcode, setManualBarcode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);

  useEffect(() => {
    startScanning();
    return () => {
      stopScanning();
    };
  }, []);

  const startScanning = async () => {
    try {
      setScanning(true);
      setError(null);
      
      const codeReader = new BrowserMultiFormatReader();
      codeReaderRef.current = codeReader;

      const videoInputDevices = await codeReader.listVideoInputDevices();
      
      if (videoInputDevices.length === 0) {
        setError('No camera found. Please use manual entry.');
        setScanning(false);
        return;
      }

      // Use the first available camera (usually back camera on mobile)
      const firstDeviceId = videoInputDevices[0].deviceId;

      codeReader.decodeFromVideoDevice(
        firstDeviceId,
        videoRef.current!,
        (result, error) => {
          if (result) {
            const barcodeValue = result.getText();
            console.log('Barcode detected:', barcodeValue);
            stopScanning();
            onScanSuccess(barcodeValue);
          }
          if (error && !(error instanceof NotFoundException)) {
            console.error('Scan error:', error);
          }
        }
      );
    } catch (err: any) {
      console.error('Camera error:', err);
      setError('Failed to access camera. Please use manual entry.');
      setScanning(false);
    }
  };

  const stopScanning = () => {
    if (codeReaderRef.current) {
      codeReaderRef.current.reset();
      codeReaderRef.current = null;
    }
    setScanning(false);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualBarcode.trim()) {
      stopScanning();
      onScanSuccess(manualBarcode.trim());
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.9)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          borderRadius: 20,
          maxWidth: 500,
          width: '100%',
          padding: 24,
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#667eea' }}>
            📷 Scan Barcode
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: 28,
              cursor: 'pointer',
              color: '#6b7280',
              padding: 0,
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ×
          </button>
        </div>

        {/* Camera Preview */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: 300,
            background: '#000',
            borderRadius: 12,
            overflow: 'hidden',
            marginBottom: 20
          }}
        >
          <video
            ref={videoRef}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
          
          {/* Scanning Overlay */}
          {scanning && (
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '70%',
                height: '40%',
                border: '3px solid #667eea',
                borderRadius: 8,
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
                pointerEvents: 'none'
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 3,
                  background: 'linear-gradient(90deg, transparent, #667eea, transparent)',
                  animation: 'scan-line 2s ease-in-out infinite'
                }}
              />
            </div>
          )}

          {error && (
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                background: 'rgba(239, 68, 68, 0.9)',
                color: 'white',
                padding: '12px 20px',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                textAlign: 'center'
              }}
            >
              {error}
            </div>
          )}
        </div>

        <style>{`
          @keyframes scan-line {
            0%, 100% { top: 0; }
            50% { top: calc(100% - 3px); }
          }
        `}</style>

        {/* Instructions */}
        <div
          style={{
            background: '#f3f4f6',
            borderRadius: 10,
            padding: 16,
            marginBottom: 20,
            fontSize: 14,
            color: '#6b7280',
            textAlign: 'center'
          }}
        >
          Position the barcode in the frame above. It will scan automatically.
        </div>

        {/* Manual Entry */}
        <div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: '#6b7280',
              marginBottom: 8,
              textAlign: 'center'
            }}
          >
            Or enter barcode manually
          </div>
          <form onSubmit={handleManualSubmit} style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              value={manualBarcode}
              onChange={(e) => setManualBarcode(e.target.value)}
              placeholder="Enter barcode number"
              style={{
                flex: 1,
                padding: '12px 16px',
                border: '2px solid #e5e7eb',
                borderRadius: 10,
                fontSize: 15,
                outline: 'none'
              }}
              onFocus={(e) => (e.target.style.borderColor = '#667eea')}
              onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')}
            />
            <button
              type="submit"
              disabled={!manualBarcode.trim()}
              style={{
                padding: '12px 24px',
                background: manualBarcode.trim()
                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                  : '#e5e7eb',
                color: manualBarcode.trim() ? 'white' : '#9ca3af',
                border: 'none',
                borderRadius: 10,
                fontSize: 15,
                fontWeight: 600,
                cursor: manualBarcode.trim() ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s'
              }}
            >
              Search
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner;
