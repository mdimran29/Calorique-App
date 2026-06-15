const axios = require('axios');
const jwt = require('jsonwebtoken');

(async () => {
  try {
    const baseURL = 'http://localhost:5000/api/v1';
    
    // Create token directly using the secret from .env
    require('dotenv').config({ path: '../../.env' });
    const secret = process.env.JWT_ACCESS_SECRET || 'dev_access_secret_123';
    // just needs an ObjectId 
    const userId = '646e3e56a66d0c41b8a3e790'; 
    
    const token = jwt.sign({ id: userId }, secret, { expiresIn: '1h' });

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
