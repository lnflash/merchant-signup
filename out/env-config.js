// Static build environment configuration
window.ENV = {
  SUPABASE_URL: "https://uygbqnrqwjvzdfbqeipf.supabase.co",
  SUPABASE_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5Z2JxbnJxd2p2emRmYnFlaXBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUwMTA5NzQsImV4cCI6MjA2MDU4Njk3NH0._galk7m0xPn_HUctiSbPw5fdWU7jyI5La-Xtm6zAt9g",
  GOOGLE_MAPS_API_KEY: "AIzaSyBNsBzd5AeJFz6aVELYIfGkYAH5_WFE4lc",
  BUILD_TIME: true,
  BUILD_DATE: "2026-01-06T15:04:07Z",
  PLATFORM: "GithubStaticDeploy",
  DEPLOY_ID: "20752317592"
};

// Set the Google Maps API key globally for hooks to find it
window.googleMapsApiKey = "AIzaSyBNsBzd5AeJFz6aVELYIfGkYAH5_WFE4lc";

// Log that the environment variables have been loaded from the static build
console.log('Static build environment variables loaded:', {
  hasUrl: !!window.ENV.SUPABASE_URL,
  hasKey: !!window.ENV.SUPABASE_KEY,
  hasGoogleMapsKey: !!window.ENV.GOOGLE_MAPS_API_KEY,
  buildTime: window.ENV.BUILD_TIME,
  buildDate: window.ENV.BUILD_DATE
});
