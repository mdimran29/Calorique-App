const axios = require('axios');

(async () => {
  try {
    const baseURL = 'http://localhost:5000/api/v1';
    
    // 1. Register a test user
    const email = `test${Date.now()}@example.com`;
    const regRes = await axios.post(`${baseURL}/auth/register`, {
      name: 'Test User',
      email: email,
      password: 'Password123!',
      passwordConfirm: 'Password123!'
    });
    
    const token = regRes.data.data.accessToken;
    console.log("Token:", token.substring(0, 20) + "...");

    // 2. Add meal
    const mealRes = await axios.post(`${baseURL}/meals`, {
      date: '2026-06-11',
      type: 'breakfast',
      foods: [{
        name: 'Apple',
        quantity: 100,
        unit: 'g',
        calories: 52,
        protein: 0.3,
        carbs: 14,
        fats: 0.2
      }]
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log("Meal Res:", JSON.stringify(mealRes.data, null, 2));

  } catch (e) {
    console.error("Error:", e.response ? JSON.stringify(e.response.data, null, 2) : e.message);
  }
})();
