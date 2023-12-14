import dotenv from 'dotenv';
import CryptoJS from 'crypto-js';
import jwt from 'jsonwebtoken';

dotenv.config();
const decrypt = (value) => CryptoJS.AES.decrypt(value, process.env.SECRET_AES_KEY).toString(CryptoJS.enc.Utf8);

export const Auth = {
	use: async (request, response, next) => {
		const { authorization } = request.headers;
		if (!authorization) {response.status(401).json('Unauthorized | No Token'); return;}
		else {
			jwt.verify(
        authorization,
        process.env.SECRET_TOKEN_KEY,
        (error, tokenDecoded) => {
          if (error) {response.status(401).json('Unauthorized | Invalid Token'); return;}
          request.id = decrypt(tokenDecoded.id);
          request.username = decrypt(tokenDecoded.username);
          next();
        }
      )
		}
	}
}


/*
let id;
    if (!request.params.idUser) {
      id = request.id;
    } else if (request.params.idUser.length !== 24) {
      response.status(404).json('Not Valid');
      return;
    } else {
      id = request.params.idUser;
    }
    let query = {_id: new ObjectId(id)};
    let projection = {
      projection: {
        _id: 1,
        info: 1,
        settings: 1,
        data: 1,
        contacts: 1,
        education: 1,
        financial: 1,
        billData: 1,
        auth: 1
      }
    };
  
    const decrypt = (value) => CryptoJS.AES.decrypt(value, process.env.SECRET_AES_KEY).toString(CryptoJS.enc.Utf8)

    let result = await collectionUsers.findOne(query, projection);
    if (!result) response.status(404).json('Not Found');
    else {
      //! -- HANDLE THIS!! --
      response.status(200).json({
        _id: result._id,
        info: {
          name: decrypt(result.info.name),
          username: result.info.username,
          profileImage: ''
        },
        settings: {
          isDarkMode: false,
        },
        data: {
          birth: {
            day: 
              result.data.birth.day
                ? decrypt(result.data.birth.day) : null,
            month: 
              result.data.birth.month
                ? decrypt(result.data.birth.month) : null,
            year: 
              result.data.birth.year
                ? decrypt(result.data.birth.year) : null
          },
          address: {
            street: 
              result.data.address.street
                ? decrypt(result.data.address.street) : null,
            number: 
              result.data.address.street
                ? decrypt(result.data.address.number) : null,
            door: {
              number: 
                result.data.address.door.number
                  ? decrypt(result.data.address.door.number) : null,
              letter: 
                result.data.address.door.letter
                  ? decrypt(result.data.address.door.letter) : null
            },
            postal: {
              main: 
                result.data.address.postal.main
                  ? decrypt(result.data.address.postal.main) : null,
              suffix: 
                result.data.address.postal.suffix
                  ? decrypt(result.data.address.postal.suffix) : null
            },
            country: 
              result.data.address.country
                ? decrypt(result.data.address.country) : null,
            state: 
              result.data.address.state
                ? decrypt(result.data.address.state) : null,
            area: 
              result.data.address.area
                ? decrypt(result.data.address.area) : null
          }
        },
        contacts: {
          email: '',
          phone: '',
          social: []
        },
        education: {
          literaryAbilities: '',
          course: '',
          professionalSituation: '',
          professionalPosition: '',
          companyName: ''
        },
        financial: {
          docIdentificacao: {
            type: '',
            number: '',
            validDate: {
              day: '',
              month: '',
              year: ''
            },
            numContribuinte: '',
            iban: ''
          }
        },
        billData: {
          isByOwner: false,
          isNotByOwnerData: {
            data: {
              name: '',
              numContribuinte: '',
              address: {
                street: '',
                number: '',
                door: {
                  number: '',
                  letter: ''
                },
                postal: {
                  main: '',
                  suffix: ''
                },
                area: ''
              }
            },
            contacts: {
              phone: '',
              email: ''
            }
          }
        },
        auth: {
          password: '',
          role: ''
        }
      })
    }

*/