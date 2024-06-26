import { ObjectId } from "mongodb";
import { collectionUsers } from "../database/conn.mjs";
import nodemailer from "nodemailer";
import CryptoJS from "crypto-js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const encrypt = (value) => CryptoJS.AES.encrypt(value, process.env.SECRET_AES_KEY).toString();
const decrypt = (value) => CryptoJS.AES.decrypt(value, process.env.SECRET_AES_KEY).toString(CryptoJS.enc.Utf8);

export const User = {
  create: async (request, response) => {
    try {
      const { username, email, password, confirmPassword } = request.body || {};
      if (!username || !email || !password || !confirmPassword) {
        return response.status(401).json("Campos obrigatórios em falta.");
      }

      const existingUser = await collectionUsers.findOne({
        $or: [{ "data.username": username }, { "contacts.email": email }],
      });

      if (existingUser) {
        const conflictField =
          existingUser.data.username === username ? "username" : "email";
        return response
          .status(409)
          .json(`Conflito: '${conflictField}' já existe.`);
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return response.status(400).json("Formato de email inválido.");
      }

      if (password !== confirmPassword) {
        return response.status(400).json("As palavras-passe não coincidem.");
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
          phone: null,
        },
        settings: {
          isDarkMode: null,
          mainColor: null,
        },
        auth: {
          password: hashedPassword,
        },
      };

      const result = await collectionUsers.insertOne(newUser);
      if (!result) response.status(401).json("Erro ao registrar utilizador.");
      else response.status(201).json("Utilizador registrado com sucesso.");
    } catch (error) {
      console.error("Erro ao registrar utilizador:", error);
      response.status(500).json("Erro interno do servidor.");
    }
  },

  get: async (request, response) => {
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
        contacts: 1,
        settings: 1,
        auth: 1,
      },
    };
    let result = await collectionUsers.findOne(query, projection);
    if (!result) response.status(404).json("Não encontrado");
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
          phone: result.contacts?.phone ? decrypt(result.contacts.phone) : null,
        },
        settings: {
          isDarkMode:
            result.settings?.isDarkMode !== null
              ? Boolean(result.settings.isDarkMode)
              : null,
          mainColor: result.settings?.mainColor ?? null,
        },
        auth: {
          password: result.auth?.password ?? null,
        },
      });
    }
  },

  update: async (request, response) => {
    try {
      let id = request.id;

      let query = { _id: new ObjectId(id) };
      let userToUpdate = await collectionUsers.findOne(query);

      if (!userToUpdate) {
        return response.status(404).json("Utilizador não encontrado.");
      }

      const {
        email,
        password,
        name,
        birth,
        address,
        phone,
        isDarkMode,
        mainColor,
      } = request.body ?? {};

      const updateFields = {};
      if (name !== undefined)
        updateFields["data.name"] = name ? encrypt(name) : "";
      if (birth !== undefined)
        updateFields["data.birth"] = birth ? encrypt(birth) : "";
      if (address !== undefined)
        updateFields["data.address"] = address ? encrypt(address) : "";
      if (email !== undefined)
        updateFields["contacts.email"] = email ? encrypt(email) : "";
      if (phone !== undefined)
        updateFields["contacts.phone"] = phone ? encrypt(phone) : "";
      if (isDarkMode !== undefined)
        updateFields["settings.isDarkMode"] =
          isDarkMode !== null ? JSON.parse(isDarkMode) : false;
      if (mainColor !== undefined)
        updateFields["settings.mainColor"] = mainColor ? mainColor : "";
      if (password !== undefined && password !== "") {
        const hashedPassword = await bcrypt.hash(password, 12);
        updateFields["auth.password"] = hashedPassword;
      }

      const result = await collectionUsers.updateOne(query, {
        $set: updateFields,
      });

      if (result.modifiedCount === 1) {
        return response
          .status(200)
          .json("Dados do utilizador atualizados com sucesso.");
      } else {
        return response
          .status(404)
          .json("Utilizador não encontrado ou dados não modificados.");
      }
    } catch (error) {
      console.error("Erro ao atualizar utilizador:", error);
      return response.status(500).json("Erro interno do servidor.");
    }
  },

  delete: async (request, response) => {
    let id = request.id;

    let query = { _id: new ObjectId(id) };
    let result = await collectionUsers.deleteOne(query);

    if (!result) response.status(404).json("Não encontrado");
    else {
      if (result.deletedCount === 1) {
        return response.status(200).json("Utilizador removido com sucesso.");
      } else {
        return response.status(404).json("Utilizador não encontrado.");
      }
    }
  },

  login: async (request, response) => {
    let { username, password, rememberMe } = request.body;
    if (!username) {
      response.status(401).json("Insira o nome de utilizador!");
      return;
    } else if (!password) {
      response.status(401).json("Insira a palavra-passe!");
      return;
    } else {
      let query = { "data.username": username };
      let result = await collectionUsers.findOne(query);
      if (!result) response.status(401).json("Utilizador não encontrado!");
      else if (!bcrypt.compareSync(password, result.auth.password))
        response.status(401).json("Inválido!");
      else {
        let expiresIn = request.body.rememberMe === "true" ? "7d" : "5h";
        jwt.sign(
          {
            id: encrypt(new ObjectId(result._id).toString()),
            username: encrypt(result.data.username),
          },
          process.env.SECRET_TOKEN_KEY,
          { expiresIn },
          (error, token) => {
            if (error) throw error;
            response.status(200).json(token);
          }
        );
        return;
      }
    }
  },

  forgotPassword: async (req, res) => {
    const email = req.body.email;

    try {
      const users = await collectionUsers.find().toArray(); 
      const user = users.find(user => decrypt(user.contacts.email) === email);

      if (!user) {
        return res.status(404).json("Não foi encontrado um utilizador com esse email.");
      }

      const resetToken = CryptoJS.lib.WordArray.random(20).toString(CryptoJS.enc.Hex); 

      const resetTokenExpires = Date.now() + 3600000;
      await collectionUsers.updateOne(
        { _id: user._id },
        {
          $set: {
            "auth.resetToken": resetToken,
            "auth.resetTokenExpires": resetTokenExpires,
          },
        }
      );

      nodemailer.createTestAccount((err, account) => {
        if (err) {
          console.error("Falha ao criar conta de teste: " + err.message);
          return res.status(500).json("Erro ao criar conta - Ethereal Email");
        }

        console.log("Credenciais obtidas, enviando email...");

        let transporter = nodemailer.createTransport({
          host: account.smtp.host,
          port: account.smtp.port,
          secure: account.smtp.secure,
          auth: {
            user: account.user,
            pass: account.pass,
          },
        });

        let message = {
          from: "Your App Name <no-reply@routewise.com>",
          to: decrypt(user.contacts.email),
          subject: "Password Reset",
          text: `
            You are receiving this email because you (or someone else) have requested the reset of the password for your account.
            Please click on the following link, or paste this into your browser to complete the process:

            ${process.env.FRONTEND_URL}/reset-password/${resetToken}

            This link will expire in 1 hour. If you did not request this, please ignore this email and your password will remain unchanged.
          `,
        };

        transporter.sendMail(message, (err, info) => {
          if (err) {
            console.log("Error occurred. " + err.message);
            return res.status(500).json("Error sending email");
          }

          console.log("Message sent: %s", info.messageId);
          console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));

          res.json("Password reset email sent");
        });
      });
    } catch (error) {
      console.error(error);
      res.status(500).json("Server Error");
    }
  },

  resetPassword: async (req, res) => {
    const resetToken = req.params.token;
    const { password, confirmPassword } = req.body;

    try {
      // 1. Find User by Reset Token:
      const user = await collectionUsers.findOne({
        "auth.resetToken": resetToken,
        "auth.resetTokenExpires": { $gt: Date.now() }, // Check if token is not expired
      });

      if (!user) {
        return res.status(400).json("Invalid or expired token");
      }

      // 2. Validate Passwords:
      if (password !== confirmPassword) {
        return res.status(400).json("Passwords do not match");
      }

      // 3. Hash the New Password:
      const hashedPassword = await bcrypt.hash(password, 12);

      // 4. Update Password and Clear Reset Token:
      await collectionUsers.updateOne(
        { _id: user._id },
        {
          $set: { "auth.password": hashedPassword },
          $unset: { "auth.resetToken": "", "auth.resetTokenExpires": "" },
        }
      );

      res.json("Password reset successful");
    } catch (error) {
      console.error("Error resetting password:", error);
      res.status(500).json("Server Error");
    }
  },
};
