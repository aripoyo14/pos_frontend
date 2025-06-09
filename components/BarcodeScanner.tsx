'use client';

import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, BarcodeFormat, DecodeHintType } from '@zxing/library';
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
  const scannedRef = useRef(false);

  useEffect(() => {
    scannedRef.current = false;
    if (isOpen && !isScanning) {
      startScanning();
    }

    return () => {
      if (isScanning) {
        stopScanning();
      }
    };
  }, [isOpen]);

  const startScanning = async () => {
    try {
      setError(null);
      setIsScanning(true);
      scannedRef.current = false;

      // カメラの権限を要求（解像度指定）
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // ZXingライブラリでバーコードスキャンを開始（バーコード種類指定）
      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.EAN_13,
        BarcodeFormat.CODE_128,
        BarcodeFormat.QR_CODE
      ]);
      codeReaderRef.current = new BrowserMultiFormatReader(hints);
      
      codeReaderRef.current.decodeFromVideoDevice(
        null, // デフォルトのビデオデバイスを使用
        videoRef.current!,
        (result, error) => {
          if (result && !scannedRef.current) {
            scannedRef.current = true;
            stopScanning();
            onScan(result.getText());
            onClose();
          }
          if (error && !(error.name === 'NotFoundException')) {
            setError('バーコードの読み取り中にエラーが発生しました: ' + error);
            stopScanning();
          }
        }
      );

    } catch (err) {
      console.error('Camera access error:', err);
      setError('カメラにアクセスできませんでした。カメラの権限を確認してください。' + (err instanceof Error ? '\n' + err.message : ''));
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    if (codeReaderRef.current) {
      try {
        codeReaderRef.current.reset();
      } catch (error) {
        console.error('Error resetting code reader:', error);
      }
    }
    if (videoRef.current && videoRef.current.srcObject) {
      try {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      } catch (error) {
        console.error('Error stopping video stream:', error);
      }
    }
    setIsScanning(false);
  };

  const handleClose = () => {
    stopScanning();
    onClose();
  };

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
                className="w-full h-full object-cover"
                autoPlay
                playsInline
              />
              <div className="absolute bottom-4 left-0 w-full flex justify-center">
                <p className="text-white text-lg bg-black bg-opacity-60 px-4 py-2 rounded">バーコードをスキャンしてください</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}