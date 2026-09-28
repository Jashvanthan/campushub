import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import {
  CheckCircle2, AlertTriangle, XCircle, Info, HelpCircle,
  Sparkles, X, Trash2, ShieldAlert
} from 'lucide-react';
import { createPortal } from 'react-dom';

const PopupContext = createContext(null);

export function PopupProvider({ children }) {
  const [dialogState, setDialogState] = useState(null);
  const [promptValue, setPromptValue] = useState('');

  const closeDialog = useCallback(() => {
    if (dialogState?.onCancel) dialogState.onCancel();
    setDialogState(null);
    setPromptValue('');
  }, [dialogState]);

  const confirmDialog = useCallback(() => {
    if (dialogState?.onConfirm) {
      dialogState.onConfirm(dialogState.mode === 'prompt' ? promptValue : true);
    }
    setDialogState(null);
    setPromptValue('');
  }, [dialogState, promptValue]);

  // Alert Popup helper
  const showAlert = useCallback((message, title = 'Notice', type = 'info') => {
    return new Promise((resolve) => {
      setDialogState({
        mode: 'alert',
        type, // 'info' | 'success' | 'warning' | 'error'
        title,
        message,
        confirmText: 'Got It',
        onConfirm: () => resolve(true)
      });
    });
  }, []);

  // Confirm Popup helper
  const showConfirm = useCallback((message, title = 'Please Confirm', options = {}) => {
    const {
      type = 'warning',
      confirmText = 'Confirm',
      cancelText = 'Cancel',
      isDanger = false
    } = options;

    return new Promise((resolve) => {
      setDialogState({
        mode: 'confirm',
        type: isDanger ? 'danger' : type,
        title,
        message,
        confirmText,
        cancelText,
        isDanger,
        onConfirm: () => resolve(true),
        onCancel: () => resolve(false)
      });
    });
  }, []);

  // Prompt Popup helper
  const showPrompt = useCallback((message, title = 'Input Required', defaultValue = '', options = {}) => {
    const {
      placeholder = 'Enter value...',
      confirmText = 'Submit',
      cancelText = 'Cancel'
    } = options;

    setPromptValue(defaultValue);

    return new Promise((resolve) => {
      setDialogState({
        mode: 'prompt',
        type: 'info',
        title,
        message,
        placeholder,
        confirmText,
        cancelText,
        onConfirm: (val) => resolve(val),
        onCancel: () => resolve(null)
      });
    });
  }, []);

  // Handle ESC and Enter keys
  useEffect(() => {
    if (!dialogState) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeDialog();
      } else if (e.key === 'Enter' && dialogState.mode !== 'prompt') {
        confirmDialog();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dialogState, closeDialog, confirmDialog]);

  return (
    <PopupContext.Provider value={{ showAlert, showConfirm, showPrompt }}>
      {children}

      {dialogState && createPortal(
        <div className="popup-dialog-overlay" onClick={closeDialog}>
          <div
            className={`popup-dialog-card glass-panel pop-${dialogState.type || 'info'}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close X */}
            <button className="popup-close-x" onClick={closeDialog}>
              <X size={16} />
            </button>

            {/* Icon Header */}
            <div className={`popup-icon-wrap type-${dialogState.type}`}>
              {dialogState.type === 'success' && <CheckCircle2 size={32} color="#10b981" />}
              {dialogState.type === 'warning' && <AlertTriangle size={32} color="#f59e0b" />}
              {(dialogState.type === 'error' || dialogState.type === 'danger') && (
                dialogState.isDanger ? <Trash2 size={32} color="#ef4444" /> : <XCircle size={32} color="#ef4444" />
              )}
              {dialogState.type === 'info' && <Info size={32} color="#818cf8" />}
            </div>

            {/* Title & Body */}
            <div className="popup-content">
              <h3 className="popup-title">{dialogState.title}</h3>
              <p className="popup-message">{dialogState.message}</p>

              {/* Prompt Input Box */}
              {dialogState.mode === 'prompt' && (
                <div className="popup-prompt-field">
                  <input
                    type="text"
                    className="form-control popup-input"
                    placeholder={dialogState.placeholder}
                    value={promptValue}
                    onChange={(e) => setPromptValue(e.target.value)}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        confirmDialog();
                      }
                    }}
                  />
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="popup-actions">
              {(dialogState.mode === 'confirm' || dialogState.mode === 'prompt') && (
                <button className="secondary-btn popup-btn-cancel" onClick={closeDialog}>
                  {dialogState.cancelText || 'Cancel'}
                </button>
              )}
              <button
                className={`primary-btn popup-btn-confirm ${dialogState.isDanger ? 'btn-danger' : ''}`}
                onClick={confirmDialog}
              >
                {dialogState.confirmText || 'Confirm'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </PopupContext.Provider>
  );
}

export function usePopup() {
  const ctx = useContext(PopupContext);
  if (!ctx) {
    // Fallback if not wrapped in provider
    return {
      showAlert: async (msg, title) => { window.alert(`${title ? title + ': ' : ''}${msg}`); return true; },
      showConfirm: async (msg) => window.confirm(msg),
      showPrompt: async (msg, _, def) => window.prompt(msg, def)
    };
  }
  return ctx;
}
