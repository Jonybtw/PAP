import { ObjectId } from 'mongodb';
import { collectionUsers } from '../database/conn.mjs';
import CryptoJS from 'crypto-js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const encrypt = (value) => CryptoJS.AES.encrypt(value, process.env.SECRET_AES_KEY).toString();
const decrypt = (value) => CryptoJS.AES.decrypt(value, process.env.SECRET_AES_KEY).toString(CryptoJS.enc.Utf8);

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
	create: async (request, response) => {
		if (
			!request.body.data_username ||
			!request.body.data_name ||
			(!request.body.contacts_email && !request.body.contacts_phone) ||
			!request.body.auth_password ||
			!request.body.auth_role
		) {
			response.status(200).json({
				code: 400,
				msg: 'Error! Missing field!',
				content: null
			});
			return;
		}
		let inputs = {
			_id: new ObjectId(),
			data: {
				username: request.body.data_username,
				name:  encrypt(request.body.data_name),
				birth:  encrypt(request.body.data_birth),
				address:  encrypt(request.body.data_address),
				routes: []
			},
			contacts: {
				email: encrypt(request.body.contacts_email),
				phone: encrypt(request.body.contacts_phone),
			},
			settings: {
				isDarkMode: '',
				mainColor: ''
			},
			auth: {
				password: bcrypt.hashSync(request.body.auth_password, 12),
				role: request.body.auth_role
			}
		}
		//response.status(200).json(inputs);
		let result = await collectionUsers.insertOne(inputs);
		if (!result) response.status(401).json('Not possible to add this user!');
		else response.status(200).json({
			code: 200,
			msg: `User added with id [${result.insertedId.toString()}]`,
			content: null
		})
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
        data: 1,
				contacts: 1,
				settings: 1,
				auth: 1,
      }
    };
		let result = await collectionUsers.findOne(query, projection);
		if (!result) response.status(404).json('Not Found');
		else {
			response.status(200).json({
				_id: result._id,
				data: {
					username: result.data.username,
					name: decrypt(result.data.name),
					birth: decrypt(result.data.birth),
					address: decrypt(result.data.address),
					routes: result.data.routes
				},
				contacts: {
					email: decrypt(result.contacts.email),
					phone: decrypt(result.contacts.phone)
				},
				settings: {
					isDarkMode: result.settings.isDarkMode,
					mainColor: result.settings.mainColor
				},
				auth: {
					password: result.auth.password,
					role: result.auth.role
				}
			});
		}
	},
	update: () => {},
	delete: () => {},

	login: async (request, response) => {
		let { username, password } = request.body;
		if (!username) {response.status(401).json('Insert username!'); return;}
		else if (!password) {response.status(401).json('Insert password!'); return;}
		else {
			let query = {'data.username': username};
			let result = await collectionUsers.findOne(query);
			if (!result) response.status(401).json('User not found!');
			else if (!bcrypt.compareSync(password, result.auth.password)) response.status(401).json('Invalid!');
			else {
				jwt.sign(
					{
						id: encrypt(new ObjectId(result._id).toString()),
						username: encrypt(result.data.username)
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