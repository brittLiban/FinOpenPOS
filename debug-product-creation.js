// Debug script to test the products API
// Run this in your browser console when on your FinOpenPOS app

async function debugProductCreation() {
  console.log('🔍 Testing product creation...');
  
  const testProduct = {
    name: 'Debug Test Product',
    sku: 'TEST-SKU-001',
    barcode: '123456789',
    price: 9.99,
    in_stock: 10,
    quantity: 10,
    description: 'Test product for debugging',
    category: 'test',
    low_stock_threshold: 5
  };
  
  try {
    const response = await fetch('/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testProduct)
    });
    
    console.log('Response status:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Product created successfully:', result);
    } else {
      const error = await response.text();
      console.log('❌ Error response:', error);
    }
  } catch (error) {
    console.error('❌ Network error:', error);
  }
}

// Run the test
debugProductCreation();
