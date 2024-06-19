//* dependencies
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';

dotenv.config();
const app = express();

//* libs
import { User } from './scripts/main/user.mjs';
import { Auth } from './scripts/utils/auth.mjs';
import { Routes } from './scripts/main/routes.mjs';
import validateTokenRouter from './scripts/utils/validate_token.mjs';

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use(bodyParser.json());
app.use(express.json());

		app.use('/validate_token', validateTokenRouter);

		//^ USER
		app.post('/login', User.login);
		app.post('/user', User.create);

		app.use(Auth.use);

		//! CRUD USER
		app.get('/user', User.get);
		app.put('/user', User.update);
		//app.delete('/user', User.delete);

		//! CRUD ROUTES
		app.post('/routes', Routes.create);
		app.get('/routes', Routes.getAll);
		app.get('/routes/:id', Routes.get);
		app.put('/routes/:id', Routes.update);
		app.delete('/routes/:id', Routes.delete);

app.listen(process.env.PORT, () => {
	console.log('\x1b[44m', 'Server is successfully connected!', '\x1b[0m');
	console.log('\x1b[34m', 'Local ->', '\x1b[0m', `http://127.0.0.1:${process.env.PORT}`);
});