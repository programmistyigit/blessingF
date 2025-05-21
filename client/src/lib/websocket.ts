// WebSocket connection management
import { baseHost } from './host';

let socket: WebSocket | null = null;
let messageHandlers: Map<string, Function[]> = new Map();

export enum WebSocketEventType {
  PRODUCTION_REPORT = 'production_report',
  INVENTORY_ALERT = 'inventory_alert',
  READY_FOR_SLAUGHTER = 'ready_for_slaughter',
  EMERGENCY_ALERT = 'emergency_alert',
  // Boshqarish vazifalari uchun WebSocket event tiplar
  TASK_ASSIGNED = 'task_assigned',        // Yangi vazifa berilganda
  TASK_UPDATED = 'task_updated',          // Vazifa yangilanganda  
  TASK_STATUS_CHANGED = 'task_status_changed', // Vazifa statusi o'zgarganda
  TASK_COMMENT_ADDED = 'task_comment_added',   // Vazifaga yangi izoh qo'shilganda
  TASK_DEADLINE_APPROACHING = 'task_deadline_approaching', // Muddati yaqinlashganda
  
  // Go'sht ishlab chiqarish uchun WebSocket event tiplar
  SLAUGHTER_BATCH_CREATED = 'slaughter_batch_created',  // Yangi so'yish partiyasi yaratilganda
  SLAUGHTER_BATCH_UPDATED = 'slaughter_batch_updated',  // So'yish partiyasi yangilanganda
  SLAUGHTER_BATCH_STATUS_CHANGED = 'slaughter_batch_status_changed', // So'yish partiyasi statusi o'zgarganda
  SLAUGHTER_BATCH_RESULTS_ADDED = 'slaughter_batch_results_added',   // So'yish natijalari kiritilganda
  MEAT_INVENTORY_CREATED = 'meat_inventory_created',    // Yangi go'sht inventari yaratilganda
  MEAT_INVENTORY_UPDATED = 'meat_inventory_updated',    // Go'sht inventari yangilanganda
  MEAT_INVENTORY_TRANSACTION = 'meat_inventory_transaction', // Go'sht sarflanganda yoki qo'shilganda
  MEAT_SALE_CREATED = 'meat_sale_created',              // Yangi savdo yaratilganda
  MEAT_SALE_UPDATED = 'meat_sale_updated',              // Savdo yangilanganda
  MEAT_SALE_PAYMENT_STATUS = 'meat_sale_payment_status', // To'lov statusi o'zgarganda
  MEAT_SALE_DELIVERY_STATUS = 'meat_sale_delivery_status', // Yetkazib berish statusi o'zgarganda
  MEAT_EXPIRY_ALERT = 'meat_expiry_alert'               // Go'sht yaroqlilik muddati yaqinlashganda
}

// Initialize WebSocket connection
export const initializeWebSocket = (): WebSocket => {
  if (socket) return socket;

  // Convert http/https to ws/wss
  const protocol = baseHost.startsWith('https') ? 'wss' : 'ws';
  const wsUrl = `${protocol}://${baseHost.replace(/^https?:\/\//, '')}/ws`;
  
  console.log('Connecting to WebSocket URL:', wsUrl);
  
  socket = new WebSocket(wsUrl);
  
  socket.onopen = () => {
    console.log('WebSocket connection established');
  };
  
  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      const { type } = data;
      
      if (type && messageHandlers.has(type)) {
        const handlers = messageHandlers.get(type) || [];
        handlers.forEach(handler => handler(data));
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  };
  
  socket.onerror = (error) => {
    console.error('WebSocket error:', error);
  };
  
  socket.onclose = () => {
    console.log('WebSocket connection closed');
    // Try to reconnect after a delay
    setTimeout(() => {
      socket = null;
      initializeWebSocket();
    }, 5000);
  };
  
  return socket;
};

// Add event handler
export const addWebSocketEventHandler = (type: WebSocketEventType | string, handler: Function): void => {
  const handlers = messageHandlers.get(type) || [];
  handlers.push(handler);
  messageHandlers.set(type, handlers);
};

// Remove event handler
export const removeWebSocketEventHandler = (type: WebSocketEventType | string, handler: Function): void => {
  const handlers = messageHandlers.get(type) || [];
  const filtered = handlers.filter(h => h !== handler);
  messageHandlers.set(type, filtered);
};

// Send message
export const sendWebSocketMessage = (message: any): void => {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(message));
  } else {
    console.error('WebSocket is not connected');
  }
};

// Close connection
export const closeWebSocketConnection = (): void => {
  if (socket) {
    socket.close();
    socket = null;
  }
  
  // Clear all handlers
  messageHandlers.clear();
};
