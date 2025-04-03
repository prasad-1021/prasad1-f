import React, { createContext, useContext, useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import ToastContainer from '../components/ToastContainer';

const ToastContext = createContext(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback((type, message, duration = 3000) => {
    const id = uuidv4();
    
    // Ensure duration is numeric and greater than 0
    const safeDuration = typeof duration === 'number' && duration > 0 ? duration : 3000;
    
    setToasts((prevToasts) => [...prevToasts, { id, type, message, duration: safeDuration }]);
    
    // Ensure toast is removed after duration - use setTimeout outside React render cycle
    const timer = setTimeout(() => {
      removeToast(id);
    }, safeDuration);
    
    // Return both id and a cleanup function
    return {
      id,
      clear: () => {
        clearTimeout(timer);
        removeToast(id);
      }
    };
  }, [removeToast]);

  const successToast = useCallback((message, duration = 3000) => 
    addToast('success', message, duration), [addToast]);
    
  const errorToast = useCallback((message, duration = 3000) => 
    addToast('error', message, duration), [addToast]);

  return (
    <ToastContext.Provider value={{ successToast, errorToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};

export default ToastContext; 