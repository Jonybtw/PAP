import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';

dotenv.config();
const dbClient = new MongoClient(process.env.ATLAS_URL || '');
export let connection;
try {
    connection = await dbClient.connect();
} catch (error) {
    console.error(error);
}
const mainDB = connection.db('data');

export default mainDB;
export const collectionUsers = mainDB.collection('users');