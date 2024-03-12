import { ObjectId } from 'mongodb';
import { collectionUsers } from '../database/conn.mjs';
import CryptoJS from 'crypto-js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const encrypt = (value) => CryptoJS.AES.encrypt(value, process.env.SECRET_AES_KEY).toString();
const decrypt = (value) => CryptoJS.AES.decrypt(value, process.env.SECRET_AES_KEY).toString(CryptoJS.enc.Utf8);

export const User = {
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
                _id: new ObjectId(),
                data: {
                    username: username,
                    name: encrypt("teste"),
                    birth: encrypt("teste"),
                    address: encrypt("teste"),
                    routes: []
                },
                contacts: {
                    email: encrypt(email),
                    phone: encrypt("teste")
                },
                settings: {
                    isDarkMode: "teste",
                    mainColor: "teste"
                },
                auth: {
                    password: hashedPassword,
                    role: "teste",
                }
            };
    
            // Insert user into MongoDB collection
            const result = await collectionUsers.insertOne(newUser);
            if(!result) response.status(401).json('Error registering user.');
            else response.status(201).json('User registered successfully.');
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
                    username: result.data?.username ?? null,
                    name: decrypt(result.data.name),
                    birth: decrypt(result.data.birth),
                    address: decrypt(result.data.address),
                    routes: result.data?.routes ?? null
                },
                contacts: {
                    email: decrypt(result.contacts?.email) ?? result.contacts.email,
                    phone: decrypt(result.data.address)
                },
                settings: {
                    isDarkMode: result.settings?.isDarkMode ?? null,
                    mainColor: result.settings?.mainColor ?? null
                },
                auth: {
                    password: result.auth?.password ?? null,
                    role: result.auth?.role ?? null,
                }
            });
        }
    },

    update: async (request, response) => {
		try {
			// Extract JWT token from request headers
			const token = request.headers.authorization;
			if (!token) {
				return response.status(401).json('Authorization token missing.');
			}
	
			// Decrypt user ID from JWT token
			const decodedToken = jwt.decode(token);
			if (!decodedToken || !decodedToken.id) {
				return response.status(401).json('Invalid token.');
			}
			const decryptedUserId = CryptoJS.AES.decrypt(decodedToken.id, process.env.SECRET_AES_KEY).toString(CryptoJS.enc.Utf8);
	
			// Check if user exists
			const userToUpdate = await collectionUsers.findOne({ _id: new ObjectId(decryptedUserId) });
			if (!userToUpdate) {
				return response.status(404).json('User not found.');
			}
	
			// Extract fields from request body
			const { username, email, password, name, birth, address, phone, isDarkMode, mainColor, role } = request.body ?? {};
	
			// Update user fields if provided
			if (username) userToUpdate.data.username = username;
			if (name) userToUpdate.data.name = name;
			if (birth) userToUpdate.data.birth = birth;
			if (address) userToUpdate.data.address = address;
			if (email) userToUpdate.contacts.email = email;
			if (phone) userToUpdate.contacts.phone = phone;
			if (isDarkMode !== undefined) userToUpdate.settings.isDarkMode = isDarkMode;
			if (mainColor) userToUpdate.settings.mainColor = mainColor;
			if (password) {
				// Hash password
				const hashedPassword = await bcrypt.hash(password, 12);
				userToUpdate.auth.password = hashedPassword;
			}
			if (role) userToUpdate.auth.role = role;
	
			// Update user in the database
			await collectionUsers.updateOne({ _id: new ObjectId(decryptedUserId) }, { $set: userToUpdate });
	
			// Return success response
			return response.status(200).json('User data updated successfully.');
		} catch (error) {
			console.error('Error updating user:', error);
			return response.status(500).json('Internal server error.');
		}
	},	

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
