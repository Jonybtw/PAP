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
                    await collectionRoutes.insertOne(resultRoutes);

                    await collectionUsers.updateOne(
                        { _id: new ObjectId(id) },
                        { $set: { "data.routes": resultRoutes._id.toString() } }
                    );
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

    getAll: async (request, response) => {
        try {
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
                        routes: 1,
                    },
                };

                let resultRoutes = await collectionRoutes.findOne(queryRoutes, projectionRoutes);
                if (!resultRoutes) {
                    response.status(404).json("Not Found Routes");
                    return;
                } else {
                    response.status(200).json(resultRoutes.routes);
                    return;
                }
            }
        } catch (error) {
            console.error("Error getting all routes:", error);
            response.status(500).json({ message: "Internal server error" });
        }
    },

    get: async (request, response) => {
        try {
            let userId;
            if (!request.params.idUser) {
                userId = request.id; // Assuming you have a mechanism to get the userId from the request
            } else if (request.params.idUser.length !== 24) {
                response.status(404).json("Not Valid User ID");
                return;
            } else {
                userId = request.params.idUser;
            }

            const routeId = request.params.id; // Get the route ID from the route parameter

            // Fetch user data
            let query = { _id: new ObjectId(userId) };
            let projection = { projection: { _id: 1, data: 1 } };
            let result = await collectionUsers.findOne(query, projection);

            if (!result) {
                response.status(404).json("Not Found User");
                return;
            }

            // Fetch routes data
            let queryRoutes = { _id: new ObjectId(result.data?.routes) };
            let projectionRoutes = { projection: { _id: 1, routes: 1 } };
            let resultRoutes = await collectionRoutes.findOne(queryRoutes, projectionRoutes);

            if (!resultRoutes) {
                response.status(404).json("Not Found Routes");
                return;
            }

            // Find the specific route
            const route = resultRoutes.routes.find(r => r._id.toString() === routeId);

            if (!route) {
                response.status(404).json("Not Found Route");
                return;
            }

            response.status(200).json(route);
        } catch (error) {
            console.error("Error getting route by ID:", error);
            response.status(500).json({ message: "Internal server error" });
        }
    },

    update: async (request, response) => {
        try {
            let userId;
            if (!request.params.idUser) {
                userId = request.id; // Assuming you have a mechanism to get the userId from the request
            } else if (request.params.idUser.length !== 24) {
                response.status(404).json("Not Valid User ID");
                return;
            } else {
                userId = request.params.idUser;
            }
    
            const routeId = request.params.id; // Get the route ID from the route parameter
    
            // Form-encoded data validation
            if (!request.body.Start || !request.body.End) {
                response.status(400).json("Invalid input data");
                return;
            }
    
            // Fetch user data
            let query = { _id: new ObjectId(userId) };
            let projection = { projection: { _id: 1, data: 1 } };
            let result = await collectionUsers.findOne(query, projection);
    
            if (!result) {
                response.status(404).json("Not Found User");
                return;
            }
    
            // Fetch routes data
            let queryRoutes = { _id: new ObjectId(result.data?.routes) };
            let projectionRoutes = { projection: { _id: 1, routes: 1 } };
            let resultRoutes = await collectionRoutes.findOne(queryRoutes, projectionRoutes);
    
            if (!resultRoutes) {
                response.status(404).json("Not Found Routes");
                return;
            }
    
            // Find the specific route and update it
            const routeIndex = resultRoutes.routes.findIndex(r => r._id.toString() === routeId);
            if (routeIndex === -1) {
                response.status(404).json("Not Found Route");
                return;
            }
    
            // Update the route in the array
            resultRoutes.routes[routeIndex].Start = request.body.Start;
            resultRoutes.routes[routeIndex].End = request.body.End;
    
            // Update the routes document in the database
            await collectionRoutes.updateOne(
                { _id: resultRoutes._id },
                { $set: { routes: resultRoutes.routes } }
            );
    
            response.status(200).json(resultRoutes.routes[routeIndex]); // Return the updated route
        } catch (error) {
            console.error("Error updating route:", error);
            response.status(500).json({ message: "Internal server error" });
        }
    },

    delete: async (request, response) => {
        try {
            const routeId = request.params.id; // Get route ID directly from :id parameter

            // Convert the routeId to ObjectId for comparison
            let objectIdRouteId;
            try {
                objectIdRouteId = new ObjectId(routeId);
            } catch (error) {
                response.status(400).json("Invalid Route ID");
                return;
            }
            // Fetch routes data directly using routeId
            let queryRoutes = { "routes._id": objectIdRouteId };
            let resultRoutes = await collectionRoutes.findOne(queryRoutes);

            if (!resultRoutes) {
                response.status(404).json("Not Found Routes");
                return;
            }

            // Find the specific route and remove it (using filter method)
            const originalRoutesLength = resultRoutes.routes.length;
            resultRoutes.routes = resultRoutes.routes.filter(r => !r._id.equals(objectIdRouteId));

            if (resultRoutes.routes.length === originalRoutesLength) {
                response.status(404).json("Not Found Route");
                return;
            }

            // Update the routes document in the database
            await collectionRoutes.updateOne(
                { _id: resultRoutes._id },
                { $set: { routes: resultRoutes.routes } }
            );

            response.status(200).json(resultRoutes.routes); // Return the updated routes array
        } catch (error) {
            console.error("Error deleting route:", error);
            response.status(500).json({ message: "Internal server error" });
        }
    },
};