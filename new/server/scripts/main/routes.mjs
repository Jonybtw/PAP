import { ObjectId } from "mongodb";
import { collectionUsers } from "../database/conn.mjs";
import CryptoJS from "crypto-js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const encrypt = (value) =>
  CryptoJS.AES.encrypt(value, process.env.SECRET_AES_KEY).toString();
const decrypt = (value) =>
  CryptoJS.AES.decrypt(value, process.env.SECRET_AES_KEY).toString(
    CryptoJS.enc.Utf8
  );

export const Routes = {
  create: async (request, response) => {
    const { uId, Start, End } = request.body;

    // Create a new route object
    const newRoute = {
      _id: new ObjectId(),
      Start,
      End,
    };

    // Find the user and add the new route to their data
    const user = await collectionUsers.findOne({ "data.users": uId });

    if (!user) {
      response.status(404).json("User not found");
      return;
    }

    user.data.routes = user.data.routes || [];
    user.data.routes.push(newRoute);

    const result = await collectionUsers.updateOne(
      { _id: user._id },
      { $set: { "data.routes": user.data.routes } }
    );

    if (result.modifiedCount === 0) {
      response.status(500).json("Failed to add route");
    } else {
      response.status(200).json(newRoute);
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
    if (!result) response.status(404).json("Not Found");
    else {
      response.status(200).json(result.data?.routes);
    }
  },
  get: async (request, response) => {},
  update: async (request, response) => {},
  delete: async (request, response) => {
    const { uId, routeId } = request.params;

    // Find the user
    const user = await collectionUsers.findOne({ "data.users": uId });

    if (!user) {
      response.status(404).json("User not found");
      return;
    }

    // Check if the route exists
    const routeExists = user.data.routes.some(
      (route) => route._id.toString() === routeId
    );

    if (!routeExists) {
      response.status(404).json("Route not found");
      return;
    }

    // Remove the route from the user's routes
    const updatedRoutes = user.data.routes.filter(
      (route) => route._id.toString() !== routeId
    );

    // Update the user document with the updated routes
    const result = await collectionUsers.updateOne(
      { _id: user._id },
      { $set: { "data.routes": updatedRoutes } }
    );

    if (result.modifiedCount === 0) {
      response.status(500).json("Failed to delete route");
    } else {
      response.status(200).json({ message: "Route deleted successfully" });
    }
  },
};
