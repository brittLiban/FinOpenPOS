// Test script for multi-tenant registration
const testRegistration = async () => {
  const testData = {
    // Company Information
    companyName: "Coffee Shop Central",
    businessType: "retail",
    
    // Owner Information (fake user ID for testing)
    ownerEmail: "test@coffeeshop.com",
    ownerUserId: "test-user-id-12345", // This would normally come from Supabase Auth
    
    // Contact Information
    contactInfo: {
      firstName: "John",
      lastName: "Coffee",
      phone: "+1-555-0123",
      address: "123 Main Street",
      city: "Seattle",
      state: "WA", 
      zipCode: "98101",
      country: "US"
    }
  };

  console.log("🧪 Testing registration with:", testData);

  try {
    const response = await fetch('http://localhost:3001/api/companies/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log("✅ Registration successful!");
      console.log("📋 Company:", result.company);
      console.log("👤 User:", result.user);
      console.log("🔗 Onboarding:", result.onboarding);
      console.log("🎯 Permissions:", result.permissions);
      console.log("👥 Roles:", result.availableRoles);
    } else {
      console.error("❌ Registration failed:", result);
    }
  } catch (error) {
    console.error("💥 Error:", error);
  }
};

// Run the test
testRegistration();
