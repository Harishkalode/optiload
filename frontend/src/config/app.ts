export const APP_CONFIG = {
  API_BASE_URL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000',
  WEBSOCKET_URL: import.meta.env.VITE_WS_URL ?? 'ws://localhost:8000/ws',
  THEME: {
    primaryColor: '#1E40AF',
    industrialColors: ['#1F2937', '#374151', '#6B7280'],
  },
};
