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
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Node modules chunking
          if (id.includes('node_modules')) {
            // Core React dependencies
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor';
            }
            
            // Supabase related (removed - migrated to FastAPI)
            // if (id.includes('@supabase') || id.includes('supabase')) {
            //   return 'supabase';
            // }
            
            // Charts and visualization libraries
            if (id.includes('recharts') || id.includes('d3') || id.includes('chart')) {
              return 'charts';
            }
            
            // Radix UI components
            if (id.includes('@radix-ui')) {
              return 'ui';
            }
            
            // Tanstack Query
            if (id.includes('@tanstack')) {
              return 'query';
            }
            
            // Router related
            if (id.includes('react-router')) {
              return 'router';
            }
            
            // Date/time libraries
            if (id.includes('date-fns') || id.includes('moment')) {
              return 'utils';
            }
            
            // Form libraries
            if (id.includes('react-hook-form') || id.includes('zod')) {
              return 'forms';
            }
            
            // Icons and assets
            if (id.includes('lucide') || id.includes('icon')) {
              return 'icons';
            }
          }
          
          // Feature-based chunking for pages
          if (id.includes('src/pages/')) {
            // Analytics suite chunk
            if (id.includes('Analytics') || id.includes('BusinessIntelligence') || id.includes('Predictive')) {
              return 'analytics';
            }
            
            // Enterprise features chunk
            if (id.includes('Enterprise') || id.includes('API') || id.includes('Multi') || id.includes('Workflow')) {
              return 'enterprise';
            }
            
            // Security features chunk
            if (id.includes('Security') || id.includes('Compliance') || id.includes('Incident') || id.includes('Emergency')) {
              return 'security';
            }
            
            // AI features chunk
            if (id.includes('AI') || id.includes('Predictive')) {
              return 'ai';
            }
            
            // Admin and dashboard chunk
            if (id.includes('Admin') || id.includes('Dashboard')) {
              return 'admin';
            }
          }
          
          // Default chunk for other modules
          return undefined;
        },
      },
      // Enable tree shaking for better optimization
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
        unknownGlobalSideEffects: false,
      },
    },
    chunkSizeWarningLimit: 500,
    // Enable minification and optimization
    minify: true, // Use default esbuild minifier
    // Enable source maps for debugging
    sourcemap: false, // Disable in production for smaller builds
    // Optimize chunk splitting
    cssCodeSplit: true,
    // Target modern browsers for better optimization
    target: 'esnext',
  },
  define: {
    global: 'globalThis',
  },
}));
