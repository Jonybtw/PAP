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
            const { username, email, password, confirmPassword } = request.body || {};
            if (!username || !email || !password || !confirmPassword) {
                return response.status(401).json('Campos obrigatórios em falta.');
            }

            const existingUser = await collectionUsers.findOne({
                $or: [{ 'data.username': username }, { 'contacts.email': email }]
            });

            if (existingUser) {
                const conflictField = existingUser.data.username === username ? 'username' : 'email';
                return response.status(409).json(`Conflito: '${conflictField}' já existe.`);
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return response.status(400).json('Formato de email inválido.');
            }

            if (password !== confirmPassword) {
                return response.status(400).json('As palavras-passe não coincidem.');
            }

            const hashedPassword = await bcrypt.hash(password, 12);

            const newUser = {
                _id: new ObjectId(),
                data: {
                    username: username,
                    name: null,
                    birth: null,
                    address: null,
                    routes: null,
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
                }
            };

            const result = await collectionUsers.insertOne(newUser);
            if (!result) response.status(401).json('Erro ao registrar utilizador.');
            else response.status(201).json('Utilizador registrado com sucesso.');
        } catch (error) {
            console.error('Erro ao registrar utilizador:', error);
            response.status(500).json('Erro interno do servidor.');
        }
    },

    get: async (request, response) => {
        let id;
        if (!request.params.idUser) {
            id = request.id;
        } else if (request.params.idUser.length !== 24) {
            response.status(404).json('Não válido');
            return;
        } else {
            id = request.params.idUser;
        }
        let query = { _id: new ObjectId(id) };
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
        if (!result) response.status(404).json('Não encontrado');
        else {
            response.status(200).json({
                _id: result._id,
                data: {
                    username: result.data?.username,
                    name: result.data?.name ? decrypt(result.data.name) : null,
                    birth: result.data?.birth ? decrypt(result.data.birth) : null,
                    address: result.data?.address ? decrypt(result.data.address) : null,
                },
                contacts: {
                    email: result.contacts?.email ? decrypt(result.contacts.email) : null,
                    phone: result.contacts?.phone ? decrypt(result.contacts.phone) : null
                },
                settings: {
                    isDarkMode: result.settings?.isDarkMode !== null ? Boolean(result.settings.isDarkMode) : null,
                    mainColor: result.settings?.mainColor ?? null
                },
                auth: {
                    password: result.auth?.password ?? null,
                }
            });
        }
    },

    update: async (request, response) => {
        try {
            const token = request.headers.authorization;
            if (!token) {
                return response.status(401).json('Token de autorização ausente.');
            }

            const decodedToken = jwt.decode(token);
            if (!decodedToken || !decodedToken.id) {
                return response.status(401).json('Token inválido.');
            }
            const decryptedUserId = CryptoJS.AES.decrypt(decodedToken.id, process.env.SECRET_AES_KEY).toString(CryptoJS.enc.Utf8);

            const userToUpdate = await collectionUsers.findOne({ _id: new ObjectId(decryptedUserId) });
            if (!userToUpdate) {
                return response.status(404).json('Utilizador não encontrado.');
            }

            const { email, routes, password, name, birth, address, phone, isDarkMode, mainColor } = request.body ?? {};

            if (name !== undefined) userToUpdate.data.name = name ? encrypt(name) : '';
            if (birth !== undefined) userToUpdate.data.birth = birth ? encrypt(birth) : '';
            if (address !== undefined) userToUpdate.data.address = address ? encrypt(address) : '';
            if (email !== undefined) userToUpdate.contacts.email = email ? encrypt(email) : '';
            if (phone !== undefined) userToUpdate.contacts.phone = phone ? encrypt(phone) : '';
            if (isDarkMode !== undefined) userToUpdate.settings.isDarkMode = isDarkMode !== null ? JSON.parse(isDarkMode) : false;
            if (mainColor !== undefined) userToUpdate.settings.mainColor = mainColor ? mainColor : '';
            if (password !== undefined && password !== '') {
                const hashedPassword = await bcrypt.hash(password, 12);
                userToUpdate.auth.password = hashedPassword;
            }

            await collectionUsers.updateOne({ _id: new ObjectId(decryptedUserId) }, { $set: userToUpdate });

            return response.status(200).json('Dados do utilizador atualizados com sucesso.');
        } catch (error) {
            console.error('Erro ao atualizar utilizador:', error);
            return response.status(500).json('Erro interno do servidor.');
        }
    },

    delete: () => { },

    login: async (request, response) => {
        let { username, password } = request.body;
        if (!username) { response.status(401).json('Insira o nome de utilizador!'); return; }
        else if (!password) { response.status(401).json('Insira a palavra-passe!'); return; }
        else {
            let query = { 'data.username': username };
            let result = await collectionUsers.findOne(query);
            if (!result) response.status(401).json('Utilizador não encontrado!');
            else if (!bcrypt.compareSync(password, result.auth.password)) response.status(401).json('Inválido!');
            else {
                jwt.sign(
                    {
                        id: encrypt(new ObjectId(result._id).toString()),
                        username: encrypt(result.data.username)
                    },
                    process.env.SECRET_TOKEN_KEY,
                    { expiresIn: '5h' },
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
