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
		try {
			// Destructure user data with validation (using optional chaining)
			const { username, email, password, confirmPassword } = request.body || {};
			if (!username || !email || !password || !confirmPassword) {
				return response.status(401).json('Missing required fields.');
			}
			// Efficiently check for existing username and email using findOne with $or operator
			const existingUser = await collectionUsers.findOne({
				$or: [{ 'data.username': username }, { 'contacts.email': email }]
			});
			
			if (existingUser) {
				const conflictField = existingUser.data.username === username ? 'username' : 'email';
				return response.status(409).json(`Conflict: '${conflictField}' already exists.`);
			}

			// Validate email format using a regular expression (optional)
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			if (!emailRegex.test(email)) {
				return response.status(400).json('Invalid email format.');
			}
	
			// Check password confirmation
			if (password !== confirmPassword) {
				return response.status(400).json('Passwords do not match.');
			}
	
			// Hash password securely using bcrypt (10 rounds recommended)
			const hashedPassword = await bcrypt.hash(password, 12);
	
			// Create new user document
			const newUser = {
				data: {
					username: username,
					name: null,
					birth: null,
					address: null,
					routes: null
				},
				contacts: {
					email: encrypt(email),
					phone: null
				},
				settings: {
					isDarkMode: null,
					mainColor: null
				},
				auth: {
					password: hashedPassword,
					role: null,
				}
				// Add other user fields as needed (e.g., firstName, lastName)
			};
	
			// Insert user into MongoDB collection
			const result = await collectionUsers.insertOne(newUser);
			if(!result) response.status(401).json('Erro ao criar');
			else response.status(201).json('User registered successfully.');
			// Handle successful registration (avoid sensitive data)
		} catch (error) {
			console.error('Error registering user:', error);
			response.status(500).json('Internal server error.'); // Generic error for security
		}
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
				auth: 1
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
					role: result.auth.role,
				}
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