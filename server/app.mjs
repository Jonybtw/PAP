//* dependencies
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';
const app = express();

//* libs
import { User } from './scripts/main/user.mjs';

dotenv.config();
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use(cors());

	//^ USER
		//! LOGIN
		app.post('/login', User.login);
		//! CRUD USER

	//^ BUS AGENCIES
		//! - Carris
		//! - Carris Metropolitana
		//! - MobiCascais
		//! - TCB
		//! - Mafrense
		//! - Boa Viagem
		//! - Ribatejana
		//! - Barraqueiro Oeste
		//! - Rodoviária do Tejo
		//! - Rodoviária do Tejo: Rápidas
		//! - Scotturb
		//! - Rodoviária do Oeste: Rápidas
	//^ TRAIN AGENCIES
		//! - CP
		//! - Fertagus
	//^ METRO AGENCIES
		//! - MTS
		//! - Metropolitano de Lisboa
	//^ ELETRICO AGENCIES
		//! - Eléctrico de Sintra
	//^ FERRY AGENCIES
		//! - Transtejo Soflusa
		//! - Atlantic Ferries
	//* more info at https://moovitapp.com/index/pt/transportes_públicos-Lisboa-2460

app.listen(process.env.PORT, () => {
	console.log('\x1b[44m', 'Server is successfully connected!', '\x1b[0m');
	console.log('\x1b[34m', 'Local ->', '\x1b[0m', `http://127.0.0.1:${process.env.PORT}`);
});