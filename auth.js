import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

export const generateToken = (userId) => {
  const payload = { userId };
  const options = { expiresIn: '1h' };
  const secret = process.env.JWT_SECRET;

  return jwt.sign(payload, secret, options);
};

export const comparePassword = (password, hashedPassword) => {
  return bcrypt.compare(password, hashedPassword);
};
