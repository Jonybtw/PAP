import { ObjectId } from "mongodb";
import { collectionRoutes, collectionUsers } from "../database/conn.mjs";
import CryptoJS from "crypto-js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const encrypt = (value) => CryptoJS.AES.encrypt(value, process.env.SECRET_AES_KEY).toString();
const decrypt = (value) => CryptoJS.AES.decrypt(value, process.env.SECRET_AES_KEY).toString(CryptoJS.enc.Utf8);

export const Routes = {
  create: async (request, response) => {
    try {
        const requestData = JSON.parse(Object.keys(request.body)[0]);

        let id;
        if (!request.params.idUser) {
            id = request.id;
        } else if (request.params.idUser.length !== 24) {
            response.status(404).json("Not Valid");
            return;
        } else {
            id = request.params.idUser;
        }
        let query = { _id: new ObjectId(id) };
        let projection = {
            projection: {
                _id: 1,
                data: 1,
            },
        };
        let result = await collectionUsers.findOne(query, projection);
        if (!result) {
            response.status(404).json("Not Found User");
            return;
        } else {
            let queryRoutes = { _id: new ObjectId(result.data?.routes) };
            let projectionRoutes = {
                projection: {
                    _id: 1,
                    routes: 1
                },
            };

            let resultRoutes = await collectionRoutes.findOne(queryRoutes, projectionRoutes);
            if (!resultRoutes) {
                // Create a new routes document if not found
                resultRoutes = { _id: new ObjectId(), routes: [] };
            }
            // Add new route to the routes array
            resultRoutes.routes.push({
                _id: new ObjectId(),
                Start: requestData?.origin?.placeId,
                End: requestData?.destination?.placeId,
            });

            let queryUpdate = { _id: resultRoutes._id };
            let update = {
                $set: {
                    routes: resultRoutes.routes
                },
            };
            let resultUpdate = await collectionRoutes.updateOne(queryUpdate, update);
            if (!resultUpdate) {
                response.status(404).json("Not Found Update");
                return;
            } else {
                response.status(200).json(resultRoutes.routes);
                return;
            }
        }
    } catch (error) {
        console.error('Error creating route:', error);
        response.status(500).json({ message: 'Internal server error' });
    }
},

};