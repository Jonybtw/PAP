import express from 'express';
import jwt from 'jsonwebtoken';

const router = express.Router();

router.get('/', (req, res) => {
  const token = req.query.token;

  if (!token) {
    res.clearCookie('token');
    return res.sendStatus(401);
  }

  jwt.verify(token, process.env.SECRET_TOKEN_KEY, (err, user) => {
    if (err) {
      console.error('Error verifying token:', err);
      res.clearCookie('token');
      return res.sendStatus(403);
    }
    res.sendStatus(200); // OK
  });
});

export default router;
