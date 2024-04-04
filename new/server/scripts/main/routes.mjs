import { ObjectId } from "mongodb";
import { collectionRoutes, collectionUsers } from "../database/conn.mjs";
import CryptoJS from "crypto-js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const encrypt = (value) => CryptoJS.AES.encrypt(value, process.env.SECRET_AES_KEY).toString();
const decrypt = (value) => CryptoJS.AES.decrypt(value, process.env.SECRET_AES_KEY).toString(CryptoJS.enc.Utf8);

export const Routes = {
  create: async (request, response) => {
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
    if (!result) response.status(404).json("Not Found User");
    else {
      let queryRoutes = { _id: new ObjectId(result.data?.routes) };
      let projectionRoutes = {
        projection: {
          _id: 1,
          routes: 1
        },
      };

      let resultRoutes = await collectionRoutes.findOne(queryRoutes, projectionRoutes);
      if (!resultRoutes) {

      } else {
        resultRoutes?.routes.push({
          _id: new ObjectId(),
          Start: request.body.Start,
          End: request.body.End
        });

        let queryUpdate = { _id: resultRoutes?._id };
        let update = {
          $set: {
            routes: resultRoutes?.routes
          },
        };
        let resultUpdate = await collectionRoutes.updateOne(queryUpdate, update);
        if (!resultUpdate) response.status(404).json("Not Found Update");
        else response.status(200).json(resultRoutes?.routes);
      }
    }
  },

  getAll: async (request, response) => {
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
    } else {
      let queryRoutes = { _id: new ObjectId(result.data?.routes) };
      let projectionRoutes = {
        projection: {
          _id: 0,
          routes: 1
        },
      };

      let resultRoutes = await collectionRoutes.findOne(queryRoutes, projectionRoutes);
      if (!resultRoutes) {
        response.status(404).json("Not Found Routes");
      } else {
        response.status(200).json(resultRoutes.routes);
      }
    }
  },

  get: async (request, response) => {
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
    } else {
      let routeId = request.params.id;
      if (!routeId || routeId.length !== 24) {
        response.status(400).json("Not Valid Route ID");
        return;
      }

      let queryRoutes = { _id: new ObjectId(result.data?.routes) };
      let projectionRoutes = {
        projection: {
          _id: 0,
          routes: {
            $elemMatch: { _id: new ObjectId(routeId) }
          }
        },
      };

      let resultRoutes = await collectionRoutes.findOne(queryRoutes, projectionRoutes);
      if (!resultRoutes || !resultRoutes.routes || resultRoutes.routes.length === 0) {
        response.status(404).json("Not Found Route");
      } else {
        response.status(200).json(resultRoutes.routes[0]);
      }
    }
  },
  update: async (request, response) => {
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
    } else {
      let routeId = request.params.id;
      if (!routeId || routeId.length !== 24) {
        response.status(400).json("Not Valid Route ID");
        return;
      }

      let queryRoutes = { _id: new ObjectId(result.data?.routes) };
      let projectionRoutes = {
        projection: {
          _id: 0,
          routes: {
            $elemMatch: { _id: new ObjectId(routeId) }
          }
        },
      };

      let resultRoutes = await collectionRoutes.findOne(queryRoutes, projectionRoutes);
      if (!resultRoutes || !resultRoutes.routes || resultRoutes.routes.length === 0) {
        response.status(404).json("Not Found Route");
      } else {
        resultRoutes.routes[0] = {
          _id: new ObjectId(routeId),
          Start: request.body.Start,
          End: request.body.End
        };
        let queryUpdate = { _id: new ObjectId(result.data?.routes), "routes._id": new ObjectId(routeId) };
        let update = {
          $set: {
            "routes.$": resultRoutes.routes[0]
          },
        };
        let resultUpdate = await collectionRoutes.updateOne(queryUpdate, update);
        if (!resultUpdate) response.status(404).json("Not Found Update");
        else response.status(200).json(resultRoutes.routes[0]);
      }
    }
  },
  delete: async (request, response) => {
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
    } else {
      let routeId = request.params.id;
      if (!routeId || routeId.length !== 24) {
        response.status(400).json("Not Valid Route ID");
        return;
      }

      let queryRoutes = { _id: new ObjectId(result.data?.routes) };
      let projectionRoutes = {
        projection: {
          _id: 1,
          routes: 1
        },
      };

      let resultRoutes = await collectionRoutes.findOne(queryRoutes, projectionRoutes);
      if (!resultRoutes) {
        response.status(404).json("Not Found Routes");
      } else {
        let routeIndex = resultRoutes.routes.findIndex(route => route._id.toString() === routeId);
        if (routeIndex === -1) {
          response.status(404).json("Not Found Route");
        } else {
          resultRoutes.routes.splice(routeIndex, 1);
          let queryUpdate = { _id: new ObjectId(result.data?.routes) };
          let update = {
            $set: {
              routes: resultRoutes.routes
            },
          };
          let resultUpdate = await collectionRoutes.updateOne(queryUpdate, update);
          if (!resultUpdate) response.status(404).json("Not Found Update");
          else response.status(200).json(resultRoutes.routes);
        }
      }
    }
  }
};