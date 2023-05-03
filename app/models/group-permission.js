import { DataTypes } from 'sequelize';

import AbstractModel from '../lib/abstract/model';

export default sequelize => {
  class GroupPermissionModel extends AbstractModel {
    constructor() {
      super();

      // Define the model
      this.defineModel(
        sequelize,
        'GroupPermission',
        {
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
        },
        {
          paranoid: true,
        }
      );

      this.defineAssociations(({ User, Group, Organization }) => {
        this.Model.user = this.Model.belongsTo(User.getModel(), {
          as: 'users',
          foreignKey: 'user',
          onDelete: 'CASCADE',
        });
        this.Model.group = this.Model.belongsTo(Group.getModel(), {
          as: 'groups',
          foreignKey: 'group',
          onDelete: 'CASCADE',
        });
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
  }

  return new GroupPermissionModel();
};
