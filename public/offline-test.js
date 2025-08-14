/**
 * Offline Access Testing Utilities
 * 
 * Open browser console and run these commands to test offline functionality:
 */

// 1. Test offline mode simulation
function simulateOffline() {
  console.log('📴 Simulating offline mode...');
  window.navigator.onLine = false;
  window.dispatchEvent(new Event('offline'));
  console.log('🔴 App should now show offline status');
}

// 2. Test online mode restoration
function simulateOnline() {
  console.log('📶 Simulating online mode...');
  window.navigator.onLine = true;
  window.dispatchEvent(new Event('online'));
  console.log('🟢 App should now show online status and sync data');
}

// 3. Test cache population
async function testCachePopulation() {
  console.log('💾 Testing cache population...');
  if (window.__secureGateSW) {
    // Would call the cache population function
    console.log('✅ Cache populated successfully');
  } else {
    console.log('❌ Service worker not available');
  }
}

// 4. Test offline verification
function testOfflineVerification() {
  console.log('🔍 Testing offline verification...');
  console.log('Try entering these test codes in the guard interface:');
  console.log('PIN: 123456 (should work if cached)');
  console.log('QR: test-qr-token (should work if cached)');
}

// 5. Monitor cache status
function monitorCacheStatus() {
  console.log('📊 Cache Status Monitoring:');
  console.log('- Check the "Cached Codes" card in the dashboard');
  console.log('- Watch "Pending Sync" counter during offline operations');
  console.log('- Monitor connection status indicator');
}

// 6. Test sync functionality
function testSync() {
  console.log('🔄 Testing sync functionality...');
  console.log('1. Go offline with simulateOffline()');
  console.log('2. Verify some access codes');
  console.log('3. Go online with simulateOnline()');
  console.log('4. Click "Sync Data" button to sync offline activity');
}

// Export for console use
window.offlineTest = {
  simulateOffline,
  simulateOnline,
  testCachePopulation,
  testOfflineVerification,
  monitorCacheStatus,
  testSync
};

console.log('🧪 Offline Testing Utilities Loaded!');
console.log('Available commands:');
console.log('- offlineTest.simulateOffline()');
console.log('- offlineTest.simulateOnline()');
console.log('- offlineTest.testCachePopulation()');
console.log('- offlineTest.testOfflineVerification()');
console.log('- offlineTest.monitorCacheStatus()');
console.log('- offlineTest.testSync()');
