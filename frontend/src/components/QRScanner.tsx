import React, { useState } from 'react';
import { QrReader } from 'react-qr-reader';

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
  disabled?: boolean;
}

function QRScanner({ onScan, onClose, disabled = false }: QRScannerProps) {
  const [error, setError] = useState('');

  const handleScan = (data: string | null) => {
    if (disabled) return;
    if (data) {
      try {
        const parsedData = JSON.parse(data);
        if (parsedData.businessId && parsedData.type === 'payment') {
          onScan(data);
        } else {
          setError('Invalid QR code');
        }
      } catch {
        setError('Invalid QR code format');
      }
    }
  };

  return (
    <div className="qr-scanner">
      <div className="scanner-container">
        <QrReader
          constraints={{ facingMode: 'environment' }}
          onResult={(result, error) => {
            if (result) {
              handleScan(result?.getText());
            }
            if (error) {
              console.error(error);
            }
          }}
          className="qr-reader"
        />
        {error && <p className="error">{error}</p>}
        <button 
          onClick={onClose} 
          className="close-btn"
          disabled={disabled}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default QRScanner; 