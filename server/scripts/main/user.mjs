import { ObjectId } from 'mongodb';
import { collectionUsers } from './database/conn.mjs';
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
	
	}
}