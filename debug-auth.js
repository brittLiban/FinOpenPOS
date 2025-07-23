// Quick debug script to test authentication
// Run this in browser console on your FinOpenPOS app

async function debugAuth() {
  console.log('🔍 Debugging Authentication...');
  
  // Test if user is logged in
  try {
    const response = await fetch('/api/products');
    console.log('GET /api/products status:', response.status);
    
    if (response.status === 401) {
      console.log('❌ User is not authenticated');
      console.log('Solution: Go to /login and sign in');
    } else if (response.status === 200) {
      console.log('✅ User is authenticated for GET requests');
      
      // Test POST request
      const postResponse = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Debug Test Product',
          price: 1.99,
          in_stock: 5,
          category: 'test'
        })
      });
      
      console.log('POST /api/products status:', postResponse.status);
      
      if (postResponse.status === 401) {
        console.log('❌ POST authentication failed');
        console.log('This suggests an issue with company_id or user profile');
      } else if (postResponse.status === 500) {
        const error = await postResponse.text();
        console.log('❌ Server error:', error);
      } else if (postResponse.status === 200) {
        const result = await postResponse.json();
        console.log('✅ POST successful:', result);
      }
    }
  } catch (error) {
    console.error('❌ Network error:', error);
  }
}

// Run the debug
debugAuth();
