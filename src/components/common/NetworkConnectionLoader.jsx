import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { networkManager } from '../../services/networkManager';

export default function NetworkConnectionLoader() {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryAttempt, setRetryAttempt] = useState(1);
  const [showRestoredNotice, setShowRestoredNotice] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    let wasOffline = false;

    const unsubscribe = networkManager.subscribe((status) => {
      if (!status.isOnline) {
        setIsOnline(false);
        wasOffline = true;
      } else {
        setIsOnline(true);
        if (wasOffline) {
          setShowRestoredNotice(true);
          wasOffline = false;
          const timer = setTimeout(() => setShowRestoredNotice(false), 3000);
          return () => clearTimeout(timer);
        }
      }
      setPendingCount(status.pendingCount || 0);
    });

    // Background auto-reconnect interval when offline
    let reconnectInterval = null;
    if (!isOnline) {
      reconnectInterval = setInterval(async () => {
        setIsRetrying(true);
        setRetryAttempt(prev => prev + 1);
        try {
          const res = await fetch('/api/health', { method: 'GET', cache: 'no-store' }).catch(() => null);
          if (res && res.ok) {
            networkManager.handleStatusChange(true);
          }
        } catch (e) {
          // Still loose / offline
        } finally {
          setIsRetrying(false);
        }
      }, 4000);
    }

    return () => {
      unsubscribe();
      if (reconnectInterval) clearInterval(reconnectInterval);
    };
  }, [isOnline]);

  const handleManualRetry = async () => {
    setIsRetrying(true);
    try {
      const res = await fetch('/api/health', { method: 'GET', cache: 'no-store' }).catch(() => null);
      if (res && res.ok) {
        await networkManager.handleStatusChange(true);
      } else {
        setRetryAttempt(prev => prev + 1);
      }
    } catch (e) {
      setRetryAttempt(prev => prev + 1);
    } finally {
      setTimeout(() => setIsRetrying(false), 500);
    }
  };

  // If online and not showing the restored notice, render nothing
  if (isOnline && !showRestoredNotice) {
    return null;
  }

  return (
    <div
      className={`network-connection-loader ${!isOnline ? 'offline-active' : 'restored-active'}`}
      style={{
        position: 'fixed',
        top: '16px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 99999,
        minWidth: '340px',
        maxWidth: '92vw',
        padding: '0.75rem 1.25rem',
        borderRadius: '14px',
        background: !isOnline
          ? 'linear-gradient(135deg, rgba(220, 38, 38, 0.95), rgba(153, 27, 27, 0.95))'
          : 'linear-gradient(135deg, rgba(16, 185, 129, 0.95), rgba(5, 150, 105, 0.95))',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: !isOnline ? '1px solid rgba(248, 113, 113, 0.4)' : '1px solid rgba(52, 211, 153, 0.4)',
        boxShadow: !isOnline
          ? '0 10px 30px -5px rgba(220, 38, 38, 0.4), 0 0 15px rgba(239, 68, 68, 0.2)'
          : '0 10px 30px -5px rgba(16, 185, 129, 0.4), 0 0 15px rgba(16, 185, 129, 0.2)',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.4rem',
        animation: 'slideDownFade 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        transition: 'all 0.3s ease'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          {!isOnline ? (
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Loader2 size={18} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
            </div>
          ) : (
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <CheckCircle2 size={18} color="#ffffff" />
            </div>
          )}

          <div>
            <div style={{ fontWeight: 700, fontSize: '0.88rem', letterSpacing: '0.01em', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              {!isOnline ? 'Network Connection Loose' : 'Connection Restored'}
              {!isOnline && (
                <span
                  style={{
                    fontSize: '0.7rem',
                    background: 'rgba(0, 0, 0, 0.25)',
                    padding: '1px 6px',
                    borderRadius: '6px',
                    fontWeight: 500
                  }}
                >
                  Attempt #{retryAttempt}
                </span>
              )}
            </div>
            <div style={{ fontSize: '0.76rem', color: 'rgba(255, 255, 255, 0.9)', marginTop: '1px' }}>
              {!isOnline
                ? 'Reconnecting to campus servers. Actions saved locally.'
                : 'All queued actions synchronized successfully.'}
            </div>
          </div>
        </div>

        {!isOnline && (
          <button
            onClick={handleManualRetry}
            disabled={isRetrying}
            style={{
              background: '#ffffff',
              color: '#dc2626',
              border: 'none',
              borderRadius: '8px',
              padding: '0.35rem 0.75rem',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: isRetrying ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
              transition: 'all 0.2s ease',
              opacity: isRetrying ? 0.75 : 1,
              whiteSpace: 'nowrap'
            }}
          >
            <RefreshCw size={13} className={isRetrying ? 'spin' : ''} />
            {isRetrying ? 'Checking...' : 'Retry'}
          </button>
        )}
      </div>

      {/* Reconnecting Progress Shimmer Line */}
      {!isOnline && (
        <div
          style={{
            width: '100%',
            height: '3px',
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '2px',
            overflow: 'hidden',
            position: 'relative',
            marginTop: '2px'
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              height: '100%',
              width: '40%',
              background: '#ffffff',
              borderRadius: '2px',
              animation: 'networkProgressShimmer 1.4s ease-in-out infinite'
            }}
          />
        </div>
      )}
    </div>
  );
}
