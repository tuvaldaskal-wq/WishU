// vite.config.ts
import { defineConfig } from "file:///sessions/determined-exciting-meitner/mnt/WishU/node_modules/vite/dist/node/index.js";
import react from "file:///sessions/determined-exciting-meitner/mnt/WishU/node_modules/@vitejs/plugin-react/dist/index.js";
import { VitePWA } from "file:///sessions/determined-exciting-meitner/mnt/WishU/node_modules/vite-plugin-pwa/dist/index.js";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      injectRegister: "auto",
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "mask-icon.svg"],
      manifest: {
        name: "WishU",
        short_name: "WishU",
        description: "Make your partner's wishes come true",
        theme_color: "#0C0C4F",
        background_color: "#F8F9FA",
        display: "standalone",
        gcm_sender_id: "159437089644",
        id: "/",
        start_url: "/",
        icons: [
          {
            src: "pwa-192x192-v2.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable"
          },
          {
            src: "pwa-512x512-v2.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable"
          }
        ],
        share_target: {
          action: "/share-target",
          method: "GET",
          enctype: "application/x-www-form-urlencoded",
          params: {
            title: "title",
            text: "text",
            url: "url"
          }
        }
      },
      devOptions: {
        enabled: true,
        type: "module"
      }
    })
  ],
  build: {
    target: "es2020"
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvc2Vzc2lvbnMvZGV0ZXJtaW5lZC1leGNpdGluZy1tZWl0bmVyL21udC9XaXNoVVwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL3Nlc3Npb25zL2RldGVybWluZWQtZXhjaXRpbmctbWVpdG5lci9tbnQvV2lzaFUvdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL3Nlc3Npb25zL2RldGVybWluZWQtZXhjaXRpbmctbWVpdG5lci9tbnQvV2lzaFUvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJ1xyXG5pbXBvcnQgcmVhY3QgZnJvbSAnQHZpdGVqcy9wbHVnaW4tcmVhY3QnXHJcbmltcG9ydCB7IFZpdGVQV0EgfSBmcm9tICd2aXRlLXBsdWdpbi1wd2EnXHJcblxyXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xyXG4gIHBsdWdpbnM6IFtcclxuICAgIHJlYWN0KCksXHJcbiAgICBWaXRlUFdBKHtcclxuICAgICAgc3RyYXRlZ2llczogJ2luamVjdE1hbmlmZXN0JyxcclxuICAgICAgc3JjRGlyOiAnc3JjJyxcclxuICAgICAgZmlsZW5hbWU6ICdzdy50cycsXHJcbiAgICAgIGluamVjdFJlZ2lzdGVyOiAnYXV0bycsXHJcbiAgICAgIHJlZ2lzdGVyVHlwZTogJ2F1dG9VcGRhdGUnLFxyXG4gICAgICBpbmNsdWRlQXNzZXRzOiBbJ2Zhdmljb24uaWNvJywgJ2FwcGxlLXRvdWNoLWljb24ucG5nJywgJ21hc2staWNvbi5zdmcnXSxcclxuICAgICAgbWFuaWZlc3Q6IHtcclxuICAgICAgICBuYW1lOiAnV2lzaFUnLFxyXG4gICAgICAgIHNob3J0X25hbWU6ICdXaXNoVScsXHJcbiAgICAgICAgZGVzY3JpcHRpb246ICdNYWtlIHlvdXIgcGFydG5lclxcJ3Mgd2lzaGVzIGNvbWUgdHJ1ZScsXHJcbiAgICAgICAgdGhlbWVfY29sb3I6ICcjMEMwQzRGJyxcclxuICAgICAgICBiYWNrZ3JvdW5kX2NvbG9yOiAnI0Y4RjlGQScsXHJcbiAgICAgICAgZGlzcGxheTogJ3N0YW5kYWxvbmUnLFxyXG4gICAgICAgIGdjbV9zZW5kZXJfaWQ6IFwiMTU5NDM3MDg5NjQ0XCIsXHJcbiAgICAgICAgaWQ6ICcvJyxcclxuICAgICAgICBzdGFydF91cmw6ICcvJyxcclxuICAgICAgICBpY29uczogW1xyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICBzcmM6ICdwd2EtMTkyeDE5Mi12Mi5wbmcnLFxyXG4gICAgICAgICAgICBzaXplczogJzE5MngxOTInLFxyXG4gICAgICAgICAgICB0eXBlOiAnaW1hZ2UvcG5nJyxcclxuICAgICAgICAgICAgcHVycG9zZTogJ2FueSBtYXNrYWJsZSdcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIHNyYzogJ3B3YS01MTJ4NTEyLXYyLnBuZycsXHJcbiAgICAgICAgICAgIHNpemVzOiAnNTEyeDUxMicsXHJcbiAgICAgICAgICAgIHR5cGU6ICdpbWFnZS9wbmcnLFxyXG4gICAgICAgICAgICBwdXJwb3NlOiAnYW55IG1hc2thYmxlJ1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIF0sXHJcbiAgICAgICAgc2hhcmVfdGFyZ2V0OiB7XHJcbiAgICAgICAgICBhY3Rpb246ICcvc2hhcmUtdGFyZ2V0JyxcclxuICAgICAgICAgIG1ldGhvZDogJ0dFVCcsXHJcbiAgICAgICAgICBlbmN0eXBlOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyxcclxuICAgICAgICAgIHBhcmFtczoge1xyXG4gICAgICAgICAgICB0aXRsZTogJ3RpdGxlJyxcclxuICAgICAgICAgICAgdGV4dDogJ3RleHQnLFxyXG4gICAgICAgICAgICB1cmw6ICd1cmwnXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9IGFzIGFueSxcclxuICAgICAgZGV2T3B0aW9uczoge1xyXG4gICAgICAgIGVuYWJsZWQ6IHRydWUsXHJcbiAgICAgICAgdHlwZTogJ21vZHVsZSdcclxuICAgICAgfVxyXG4gICAgfSlcclxuICBdLFxyXG4gIGJ1aWxkOiB7XHJcbiAgICB0YXJnZXQ6ICdlczIwMjAnLFxyXG4gIH1cclxufSlcclxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUErVCxTQUFTLG9CQUFvQjtBQUM1VixPQUFPLFdBQVc7QUFDbEIsU0FBUyxlQUFlO0FBR3hCLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVM7QUFBQSxJQUNQLE1BQU07QUFBQSxJQUNOLFFBQVE7QUFBQSxNQUNOLFlBQVk7QUFBQSxNQUNaLFFBQVE7QUFBQSxNQUNSLFVBQVU7QUFBQSxNQUNWLGdCQUFnQjtBQUFBLE1BQ2hCLGNBQWM7QUFBQSxNQUNkLGVBQWUsQ0FBQyxlQUFlLHdCQUF3QixlQUFlO0FBQUEsTUFDdEUsVUFBVTtBQUFBLFFBQ1IsTUFBTTtBQUFBLFFBQ04sWUFBWTtBQUFBLFFBQ1osYUFBYTtBQUFBLFFBQ2IsYUFBYTtBQUFBLFFBQ2Isa0JBQWtCO0FBQUEsUUFDbEIsU0FBUztBQUFBLFFBQ1QsZUFBZTtBQUFBLFFBQ2YsSUFBSTtBQUFBLFFBQ0osV0FBVztBQUFBLFFBQ1gsT0FBTztBQUFBLFVBQ0w7QUFBQSxZQUNFLEtBQUs7QUFBQSxZQUNMLE9BQU87QUFBQSxZQUNQLE1BQU07QUFBQSxZQUNOLFNBQVM7QUFBQSxVQUNYO0FBQUEsVUFDQTtBQUFBLFlBQ0UsS0FBSztBQUFBLFlBQ0wsT0FBTztBQUFBLFlBQ1AsTUFBTTtBQUFBLFlBQ04sU0FBUztBQUFBLFVBQ1g7QUFBQSxRQUNGO0FBQUEsUUFDQSxjQUFjO0FBQUEsVUFDWixRQUFRO0FBQUEsVUFDUixRQUFRO0FBQUEsVUFDUixTQUFTO0FBQUEsVUFDVCxRQUFRO0FBQUEsWUFDTixPQUFPO0FBQUEsWUFDUCxNQUFNO0FBQUEsWUFDTixLQUFLO0FBQUEsVUFDUDtBQUFBLFFBQ0Y7QUFBQSxNQUNGO0FBQUEsTUFDQSxZQUFZO0FBQUEsUUFDVixTQUFTO0FBQUEsUUFDVCxNQUFNO0FBQUEsTUFDUjtBQUFBLElBQ0YsQ0FBQztBQUFBLEVBQ0g7QUFBQSxFQUNBLE9BQU87QUFBQSxJQUNMLFFBQVE7QUFBQSxFQUNWO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
