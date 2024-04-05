import express from 'express';
import jwt from 'jsonwebtoken';

const router = express.Router();

router.get('/', (req, res) => {
  const token = req.query.token; // Retrieve token from query parameter

  if (!token) {
    res.clearCookie('token'); // Clear the token cookie
    return res.sendStatus(401); // Unauthorized
  }

  jwt.verify(token, process.env.SECRET_TOKEN_KEY, (err, user) => {
    if (err) {
      console.error('Error verifying token:', err); // Log any errors
      res.clearCookie('token'); // Clear the token cookie
      return res.sendStatus(403); // Forbidden
    }
    res.sendStatus(200); // OK
  });
});

export default router;
