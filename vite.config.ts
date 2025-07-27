import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      build: {
        rollupOptions: {
          input: {
            main: path.resolve(__dirname, 'index.html')
          }
        }
      },
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      // Exclude all HTML files except index.html from being processed
      optimizeDeps: {
        entries: ['index.html']
      },
      server: {
        host: true,
        port: 5173,
        proxy: {
          // Database API proxy
          '/api/sessions': {
            target: 'http://localhost:3001',
            changeOrigin: true
          },
          // Binance API proxy
          '/binance-api': {
            target: 'https://api.binance.com',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/binance-api/, '')
          },
          // Other exchange proxies
          '/coinbase-api': {
            target: 'https://api.exchange.coinbase.com',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/coinbase-api/, '')
          },
          // MEXC API proxy
          '/mexc-api': {
            target: 'https://api.mexc.com',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/mexc-api/, '')
          }
        }
      }
    };
});
