// validate_token.mjs
import express from 'express';
import jwt from 'jsonwebtoken';

const router = express.Router();

router.post('/', (req, res) => {
  const token = req.body.token;
  
  if (!token) {
    res.clearCookie('token'); // Clear the token cookie
    return res.sendStatus(401); // Unauthorized
  }

  jwt.verify(token, process.env.SECRET_AES_KEY, (err, user) => {
    if (err) {
      res.clearCookie('token'); // Clear the token cookie
      return res.sendStatus(403); // Forbidden
    }
    res.sendStatus(200); // OK
  });
});

export default router;