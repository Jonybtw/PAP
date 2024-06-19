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
                response.status(404).json("Não válido");
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
                response.status(404).json("Utilizador não encontrado");
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
                    resultRoutes = { _id: new ObjectId(), routes: [] };
                    await collectionRoutes.insertOne(resultRoutes);

                    await collectionUsers.updateOne(
                        { _id: new ObjectId(id) },
                        { $set: { "data.routes": resultRoutes._id.toString() } }
                    );
                }
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
                    response.status(404).json("Atualização não encontrada");
                    return;
                } else {
                    response.status(200).json(resultRoutes.routes);
                    return;
                }
            }
        } catch (error) {
            console.error('Erro ao criar rota:', error);
            response.status(500).json({ message: 'Erro interno do servidor' });
        }
    },

    getAll: async (request, response) => {
        try {
            let id;
            if (!request.params.idUser) {
                id = request.id;
            } else if (request.params.idUser.length !== 24) {
                response.status(404).json("Não válido");
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
                response.status(404).json("Utilizador não encontrado");
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
                    response.status(404).json("Rotas não encontradas");
                    return;
                } else {
                    response.status(200).json(resultRoutes.routes);
                    return;
                }
            }
        } catch (error) {
            console.error("Erro ao obter todas as rotas:", error);
            response.status(500).json({ message: "Erro interno do servidor" });
        }
    },

    get: async (request, response) => {
        try {
            let userId;
            if (!request.params.idUser) {
                userId = request.id;
            } else if (request.params.idUser.length !== 24) {
                response.status(404).json("ID de Utilizador Inválido");
                return;
            } else {
                userId = request.params.idUser;
            }

            const routeId = request.params.id;

            let query = { _id: new ObjectId(userId) };
            let projection = { projection: { _id: 1, data: 1 } };
            let result = await collectionUsers.findOne(query, projection);

            if (!result) {
                response.status(404).json("Utilizador não encontrado");
                return;
            }

            let queryRoutes = { _id: new ObjectId(result.data?.routes) };
            let projectionRoutes = { projection: { _id: 1, routes: 1 } };
            let resultRoutes = await collectionRoutes.findOne(queryRoutes, projectionRoutes);

            if (!resultRoutes) {
                response.status(404).json("Rotas não encontradas");
                return;
            }

            const route = resultRoutes.routes.find(r => r._id.toString() === routeId);

            if (!route) {
                response.status(404).json("Rota não encontrada");
                return;
            }

            response.status(200).json(route);
        } catch (error) {
            console.error("Erro ao obter rota por ID:", error);
            response.status(500).json({ message: "Erro interno do servidor" });
        }
    },

    update: async (request, response) => {
        try {
            let userId;
            if (!request.params.idUser) {
                userId = request.id;
            } else if (request.params.idUser.length !== 24) {
                response.status(404).json("ID de Utilizador Inválido");
                return;
            } else {
                userId = request.params.idUser;
            }

            const routeId = request.params.id;

            if (!request.body.Start || !request.body.End) {
                response.status(400).json("Dados de entrada inválidos");
                return;
            }

            let query = { _id: new ObjectId(userId) };
            let projection = { projection: { _id: 1, data: 1 } };
            let result = await collectionUsers.findOne(query, projection);

            if (!result) {
                response.status(404).json("Utilizador não encontrado");
                return;
            }

            let queryRoutes = { _id: new ObjectId(result.data?.routes) };
            let projectionRoutes = { projection: { _id: 1, routes: 1 } };
            let resultRoutes = await collectionRoutes.findOne(queryRoutes, projectionRoutes);

            if (!resultRoutes) {
                response.status(404).json("Rotas não encontradas");
                return;
            }

            const routeIndex = resultRoutes.routes.findIndex(r => r._id.toString() === routeId);
            if (routeIndex === -1) {
                response.status(404).json("Rota não encontrada");
                return;
            }

            resultRoutes.routes[routeIndex].Start = request.body.Start;
            resultRoutes.routes[routeIndex].End = request.body.End;

            await collectionRoutes.updateOne(
                { _id: resultRoutes._id },
                { $set: { routes: resultRoutes.routes } }
            );

            response.status(200).json(resultRoutes.routes[routeIndex]);
        } catch (error) {
            console.error("Erro ao atualizar rota:", error);
            response.status(500).json({ message: "Erro interno do servidor" });
        }
    },

    delete: async (request, response) => {
        try {
            const routeId = request.params.id;

            let objectIdRouteId;
            try {
                objectIdRouteId = new ObjectId(routeId);
            } catch (error) {
                response.status(400).json("ID de Rota Inválido");
                return;
            }

            let queryRoutes = { "routes._id": objectIdRouteId };
            let resultRoutes = await collectionRoutes.findOne(queryRoutes);

            if (!resultRoutes) {
                response.status(404).json("Rotas não encontradas");
                return;
            }

            const originalRoutesLength = resultRoutes.routes.length;
            resultRoutes.routes = resultRoutes.routes.filter(r => !r._id.equals(objectIdRouteId));

            if (resultRoutes.routes.length === originalRoutesLength) {
                response.status(404).json("Rota não encontrada");
                return;
            }

            await collectionRoutes.updateOne(
                { _id: resultRoutes._id },
                { $set: { routes: resultRoutes.routes } }
            );

            response.status(200).json(resultRoutes.routes);
        } catch (error) {
            console.error("Erro ao eliminar rota:", error);
            response.status(500).json({ message: "Erro interno do servidor" });
        }
    },
};