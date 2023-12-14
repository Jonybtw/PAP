import { ObjectId } from 'mongodb';
import { collectionUsers } from '../database/conn.mjs';
import CryptoJS from 'crypto-js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const encrypt = (value) => CryptoJS.AES.encrypt(value, process.env.SECRET_AES_KEY).toString();
const decrypt = (value) => CryptoJS.AES.decrypt(value, process.env.SECRET_AES_KEY).toString(CryptoJS.enc.Utf8);

//! HANDLE USER MODEL

//TODO: MAKE USER MODEL
/*
	(my suggestion)
	{
		data: {
			username: --,
			birth: --,
			address: --,
			routes: [],
			...
		},
		contacts: {
			email: --,
			phone: --,
		},
		settings: {
			isDarkMode: --
			...
		},
		auth: {
			password: --
			...
		}
	}
*/

export const User = {
	//^ CRUD
	create: async (request, response) => {

	},
	get: async (request, response) => {
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
        name: 1,
				password: 1,
				username: 1
      }
    };
		let result = await collectionUsers.findOne(query, projection);
		if (!result) response.status(404).json('Not Found');
		else {
			response.status(200).json({
				_id: result._id,
				name: result.name,
				password: result.password,
				username: result.username
			});
		}
	},
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
						id: encrypt(new ObjectId(result._id).toString()),
						username: encrypt(result.username)
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