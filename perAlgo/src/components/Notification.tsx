import { toast } from 'react-hot-toast';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import React from 'react';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning';
  message: string;
  timestamp: Date;
}

let notifications: Notification[] = [];
let onNotificationChange: (notifications: Notification[]) => void = () => {};

export const setNotificationChangeHandler = (handler: (notifications: Notification[]) => void) => {
  onNotificationChange = handler;
};

export const getNotifications = () => notifications;

export const clearNotifications = () => {
  notifications = [];
  onNotificationChange(notifications);
};

const addNotification = (type: 'success' | 'error' | 'warning', message: string) => {
  const notification = {
    id: Date.now().toString(),
    type,
    message,
    timestamp: new Date()
  };
  notifications = [notification, ...notifications].slice(0, 50); // Keep last 50 notifications
  onNotificationChange(notifications);
};

export const notify = {
  success: (message: string) => {
    addNotification('success', message);
    toast.success(message, {
      duration: 4000,
      position: 'top-right',
      icon: React.createElement(CheckCircle, { className: "w-5 h-5 text-green-500" }),
      style: {
        background: '#fff',
        color: '#333',
        padding: '16px',
        borderRadius: '10px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      },
    });
  },
  
  error: (message: string) => {
    addNotification('error', message);
    toast.error(message, {
      duration: 4000,
      position: 'top-right',
      icon: React.createElement(XCircle, { className: "w-5 h-5 text-red-500" }),
      style: {
        background: '#fff',
        color: '#333',
        padding: '16px',
        borderRadius: '10px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      },
    });
  },
  
  warning: (message: string) => {
    addNotification('warning', message);
    toast(message, {
      duration: 4000,
      position: 'top-right',
      icon: React.createElement(AlertCircle, { className: "w-5 h-5 text-yellow-500" }),
      style: {
        background: '#fff',
        color: '#333',
        padding: '16px',
        borderRadius: '10px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      },
    });
  }
};