const mongoose = require('mongoose');
const { User } = require('./src/models/User.model');
require('dotenv').config({ path: '../../.env' });
const { generateTokens } = require('./src/utils/tokenUtils');

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  let user = await User.findOne({ email: 'test@test.com' });
  if (!user) {
    user = await User.create({ email: 'test@test.com', name: 'Test', firebaseUid: 'dummy_uid' });
  }
  const tokens = generateTokens(user.id);
  console.log("TOKEN=" + tokens.accessToken);
  process.exit(0);
})();
