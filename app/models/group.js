import { QueryTypes } from 'sequelize';

import AbstractModel from '../lib/abstract/model';

export default (sequelize, DataTypes) => {
  const schema = {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: sequelize.literal('NOW()'),
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: sequelize.literal('NOW()'),
      allowNull: false,
    },
  };

  const options = {
    paranoid: true,
    indexes: [
      {
        unique: true,
        name: 'group_name',
        fields: ['name', 'organization'],
      },
    ],
  };

  class GroupModel extends AbstractModel {
    constructor() {
      super();

      // Define the model
      this.defineModel(sequelize, 'Group', schema, options);

      // Define the model associations
      this.defineAssociations(({ Organization, User }) => {
        this.Model.organization = this.Model.belongsTo(Organization.getModel(), {
          foreignKey: {
            name: 'organization',
            allowNull: false,
            validate: {
              notNull: {
                msg: 'groups:organization-error-required',
              },
            },
          },
          onDelete: 'CASCADE',
        });
        this.Model.createdBy = this.Model.belongsTo(User.getModel(), {
          as: 'creator',
          foreignKey: 'createdBy',
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE',
        });
        this.Model.updatedBy = this.Model.belongsTo(User.getModel(), {
          as: 'editor',
          foreignKey: 'updatedBy',
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE',
        });
        this.Model.deletedBy = this.Model.belongsTo(User.getModel(), {
          as: 'deletor',
          foreignKey: 'deletedBy',
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE',
        });
      });
    }

    /**
     *
     * @param  userId
     */
    async getGroupByUserId(userId) {
      const query = `select
      gp.organization,g.name
    from
      "Groups" g
    join "GroupPermissions" gp on
      gp."group" = g.id
    where
      gp."user" = ${userId};`;
      const [groups] = await this.query(query, QueryTypes.SELECT);
      return groups;
    }
  }

  return new GroupModel();
};
