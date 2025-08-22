/**
 * Authentication Test Script
 * 
 * This script helps test and debug authentication issues.
 * Run this in the browser console after logging in to check session state.
 */

// Test 1: Check current session
async function checkSession() {
  try {
    const response = await fetch('/api/auth/session');
    const session = await response.json();
    console.log('Current session:', session);
    
    if (session?.user) {
      console.log('✅ User is authenticated');
      console.log('User ID:', session.user.id);
      console.log('User Name:', session.user.name);
      console.log('User Email:', session.user.email);
      console.log('User Role:', session.user.role);
    } else {
      console.log('❌ No active session');
    }
    
    return session;
  } catch (error) {
    console.error('Error checking session:', error);
  }
}

// Test 2: Check if user data is consistent
async function checkUserConsistency() {
  const session = await checkSession();
  
  if (!session?.user?.id) {
    console.log('❌ Cannot check consistency - no user ID');
    return;
  }
  
  // This would need to be implemented as an API endpoint
  console.log('ℹ️ To check database consistency, implement /api/debug/user-check endpoint');
}

// Test 3: Force session refresh
async function refreshSession() {
  try {
    // Trigger a session update
    const event = new Event('visibilitychange');
    document.dispatchEvent(event);
    
    // Wait a bit and check again
    setTimeout(async () => {
      console.log('Session after refresh:');
      await checkSession();
    }, 1000);
  } catch (error) {
    console.error('Error refreshing session:', error);
  }
}

// Test 4: Check authentication flow
function testAuthFlow() {
  console.log('🔍 Authentication Test Results:');
  console.log('================================');
  
  // Check if we're on a protected page
  const isProtectedPage = window.location.pathname.startsWith('/admin') || 
                         window.location.pathname.startsWith('/account');
  
  console.log('Protected page:', isProtectedPage);
  console.log('Current URL:', window.location.href);
  
  // Run session check
  checkSession().then(session => {
    if (session?.user && isProtectedPage) {
      console.log('✅ Authentication working correctly');
    } else if (!session?.user && isProtectedPage) {
      console.log('❌ On protected page but no session');
    } else if (session?.user && !isProtectedPage) {
      console.log('ℹ️ Authenticated on public page');
    } else {
      console.log('ℹ️ Not authenticated on public page');
    }
  });
}

// Auto-run test when script loads
if (typeof window !== 'undefined') {
  console.log('🚀 Authentication test script loaded');
  console.log('Run testAuthFlow() to check authentication status');
  console.log('Run checkSession() to see current session');
  console.log('Run refreshSession() to force session refresh');
}

// Export functions for manual testing
window.authTest = {
  checkSession,
  checkUserConsistency,
  refreshSession,
  testAuthFlow
};
