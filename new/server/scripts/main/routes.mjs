import { ObjectId } from 'mongodb';
import { collectionUsers } from '../database/conn.mjs';
import CryptoJS from 'crypto-js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const encrypt = (value) => CryptoJS.AES.encrypt(value, process.env.SECRET_AES_KEY).toString();
const decrypt = (value) => CryptoJS.AES.decrypt(value, process.env.SECRET_AES_KEY).toString(CryptoJS.enc.Utf8);

export const Routes = {
    create: async (request, response) => {},
    getAll: async (request, response) => {
        let id;
        if (!request.params.idUser) {
            id = request.id;
        } else if (request.params.idUser.length !== 24) {
            response.status(404).json('Not Valid');
            return;
        } else {
            id = request.params.idUser;
        }
        let query = {_id: new ObjectId(id)};
        let projection = {
            projection: {
                _id: 1,
                data: 1,
            }
        };
        let result = await collectionUsers.findOne(query, projection);
        if (!result) response.status(404).json('Not Found');
        else {
            response.status(200).json(result.data?.routes);
        }
    },
    get: async (request, response) => {},
    update: async (request, response) => {},
    delete: async (request, response) => {},
};