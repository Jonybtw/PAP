import dotenv from 'dotenv';
import CryptoJS from 'crypto-js';
import jwt from 'jsonwebtoken';

dotenv.config();
const decrypt = (value) => CryptoJS.AES.decrypt(value, process.env.SECRET_AES_KEY).toString(CryptoJS.enc.Utf8);

export const Auth = {
  use: async (request, response, next) => {
    const { authorization } = request.headers;
    if (!authorization) { response.status(401).json('Não autorizado | Token ausente'); return; }
    else {
      jwt.verify(
        authorization,
        process.env.SECRET_TOKEN_KEY,
        (error, tokenDecoded) => {
          if (error) { response.status(401).json('Não autorizado | Token inválido'); return; }
          request.id = decrypt(tokenDecoded.id);
          request.username = decrypt(tokenDecoded.username);
          next();
        }
      )
    }
  }
}
