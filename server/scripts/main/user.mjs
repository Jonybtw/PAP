import { ObjectId } from 'mongodb';
import { collectionUsers } from '../database/conn.mjs';
import CryptoJS from 'crypto-js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export const User = {
	//^ CRUD
	create: () => {},
	get: () => {},
	update: () => {},
	delete: () => {},
	//^ LOGIN
	login: async (request, response) => {
		let { username, password } = request.body;
		if (!username) {response.status(401).json('Insert username!'); return;}
		else if (!password) {response.status(401).json('Insert password!'); return;}
		else {
			let query = {'username': username};
			let result = await collectionUsers.findOne(query);
			if (!result) response.status(401).json('User not found!');
			else if (!bcrypt.compareSync(password, result.password)) response.status(401).json('Invalid!');
			else {
				jwt.sign(
					{
						id: new ObjectId(result._id).toString(),
						username: result.username
					},
					process.env.SECRET_TOKEN_KEY,
					//! { expiresIn: '30s' },
					(error, token) => { 
						if (error) throw error; 
						response.status(200).json(token);
					}
				);
				return;
			}
		}
	}
}