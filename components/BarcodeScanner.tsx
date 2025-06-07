'use client';

import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';
import { X, Camera } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

export default function BarcodeScanner({ onScan, onClose, isOpen }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);

  useEffect(() => {
    if (isOpen && !isScanning) {
      startScanning();
    }

    return () => {
      stopScanning();
    };
  }, [isOpen]);

  const startScanning = async () => {
    try {
      setError(null);
      setIsScanning(true);

      // カメラの権限を要求
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' } // 背面カメラを優先
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // ZXingライブラリでバーコードスキャンを開始
      codeReaderRef.current = new BrowserMultiFormatReader();
      
      codeReaderRef.current.decodeFromVideoDevice(
        undefined, // デフォルトのビデオデバイスを使用
        videoRef.current!,
        (result, error) => {
          if (result) {
            const barcode = result.getText();
            onScan(barcode);
            stopScanning();
            onClose();
          }
          if (error && !(error.name === 'NotFoundException')) {
            console.error('Barcode scan error:', error);
          }
        }
      );

    } catch (err) {
      console.error('Camera access error:', err);
      setError('カメラにアクセスできませんでした。カメラの権限を確認してください。');
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    if (codeReaderRef.current) {
      codeReaderRef.current.reset();
      codeReaderRef.current = null;
    }

    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }

    setIsScanning(false);
  };

  const handleClose = () => {
    stopScanning();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className="relative w-full h-full max-w-md max-h-96 mx-4">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-full transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Scanner Interface */}
        <div className="relative w-full h-full bg-black rounded-lg overflow-hidden">
          {error ? (
            <div className="flex flex-col items-center justify-center h-full text-white p-6 text-center">
              <Camera className="w-16 h-16 mb-4 text-gray-400" />
              <p className="text-lg mb-4">{error}</p>
              <button
                onClick={handleClose}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg"
              >
                閉じる
              </button>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              
              {/* Scanning Overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  {/* Scanning Frame */}
                  <div className="w-80 h-32 border-2 border-white border-opacity-50 relative">
                    {/* Corner indicators */}
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500"></div>
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500"></div>
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500"></div>
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500"></div>
                    
                    {/* Scanning line animation */}
                    <div className="absolute inset-0 overflow-hidden">
                      <div className="w-full h-0.5 bg-blue-500 animate-pulse"></div>
                    </div>
                  </div>
                  
                  <p className="text-white text-center mt-4 text-lg">
                    バーコードをフレーム内に合わせてください
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}