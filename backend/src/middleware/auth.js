const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    console.log('Received token:', token);
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token:', decodedToken);
    req.userId = decodedToken.userId;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ message: 'Authentication failed' });
  }
};