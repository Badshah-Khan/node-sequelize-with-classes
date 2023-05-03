import config from 'config';
import { genSaltSync, hashSync, compareSync } from 'bcrypt';
import jwt from 'jsonwebtoken';

import AbstractModel from '../lib/abstract/model';

export default (sequelize, DataTypes) => {
  const schema = {
    firstName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notNull: {
              msg: 'first name is required'
            }
        }
    },
    lastName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notNull: {
            msg: 'user:last-name-error-required',
            },
        },
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: {
            name: 'email',
            msg: 'email should be unique',
        },
        validate: {
            notNull: {
              msg: 'email is required'
            },
            isEmail: {
                msg: 'invalid email',
            }
        }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notNull: {
              msg: 'Password is required'
            },
            len: {
                args: [config.get('app.password.passwordMinLength')],
                msg: 'minimum password length 6',
            },
            is: {
                args: [new RegExp(config.get('app.password.policy'))],
                msg: 'user:password-error-policy',
            },
        }
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
  };

  const options = {
    indexes: [],
  };

  class UserModel extends AbstractModel {
    constructor() {
      super();

      // Define the model
      this.defineModel(sequelize, 'User', schema, options);
    }

    async create(req, res){
      const { body } = req;

      const salt = genSaltSync(10);
      const hash = hashSync(body.password, salt);

      if(body.password !== body.confPassword){
        return res.json({
          message: 'Password should be same',
          success: false,
          status: 401
        })
      }
      delete body.confPassword;

      const result = await this.Model.create({...body, password: hash});
      return res.json({
        result,
        success: true,
        status: 200
      })
    }

    async login(req, res){
      const { body: { email, password } } = req;

      const [foundUser] = await this.Model.findOne({where: { email }});
      if(foundUser){
        const checkPass = compareSync(password, foundUser.password);

        if(checkPass){
          delete foundUser.password;

          const token = jwt.sign({...foundUser.defaultValue}, config.get('security.jwt.secret'), 
            { algorithm: config.get('security.jwt.algorithm'), expiresIn: config.get('security.jwt.expiresIn') });
          
          res.statusCode(200);
          return res.json({
            token,
            user: foundUser,
            success: true,
            status: 200
          })
        }else{
          return res.json({
            success: false,
            message: "Email and password does not match",
            statusCode: 401
          })
        }
      }else{
        return res.json({
          success: false,
          message: "User Not Found",
          statusCode: 401
        })
      }
    }
  }

  return new UserModel();
};
