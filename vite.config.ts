import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    exclude: ['@sentry/react'], // Exclude Sentry from pre-bundling (it's optional)
  },
  build: {
    // Увеличиваем лимит размера чанка
    chunkSizeWarningLimit: 1000,
    
    rollupOptions: {
      output: {
        // Разделяем vendor библиотеки на отдельные чанки для лучшего кеширования
        manualChunks: {
          // React core
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Radix UI компоненты
          'vendor-radix': [
            '@radix-ui/react-accordion',
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-popover',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-collapsible',
            '@radix-ui/react-radio-group',
            '@radix-ui/react-label',
            '@radix-ui/react-slot',
          ],
          // Графики
          'vendor-charts': ['recharts'],
          // React Query
          'vendor-query': ['@tanstack/react-query'],
          // Supabase
          'vendor-supabase': ['@supabase/supabase-js'],
          // Date utilities
          'vendor-date': ['date-fns'],
        },
      },
    },
    
    // Оптимизация: отключаем source maps в проде для ускорения
    sourcemap: mode === 'development',
    
    // Минификация
    minify: 'esbuild', // esbuild быстрее чем terser
  },
}));
