import AbstractModel from '../lib/abstract/model';

export default (sequelize, DataTypes) => {
  const schema = {
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notNull: {
              msg: 'name is required'
            }
        }
    }
  };

  const options = {
    indexes: [],
  };

  class UserTypeModel extends AbstractModel {
    constructor() {
        super();
  
        // Define the model
        this.defineModel(sequelize, 'UserType', schema, options);
    }
  }

  return new UserTypeModel();
};
