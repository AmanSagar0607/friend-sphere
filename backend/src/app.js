const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');

const app = express();

// Set strictQuery to true to suppress the warning
mongoose.set('strictQuery', true);

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000 // Timeout after 5s instead of 30s
})
.then(() => console.log('Connected to MongoDB'))
.catch((err) => {
  console.error('MongoDB connection error:', err);
  console.error('MongoDB URI:', process.env.MONGODB_URI);
  process.exit(1); // Exit the process with failure
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));