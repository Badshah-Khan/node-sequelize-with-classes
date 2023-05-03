import _ from 'lodash';
// import config from 'config';

import AbstractModel from '../lib/abstract/model';
import { models } from '../lib/db';
// import { sendEmail } from '../services/mailer';
import { UserRoles } from '../constants/role';

export default (sequelize, DataTypes) => {
  const schema = {
    workspace: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'organization:workspace-error-required',
        },
        is: {
          args: /^[a-z0-9-]+$/i,
          msg: 'organization:workspace-error-invalid',
        },
        len: {
          args: [3, 50],
          msg: 'organization:workspace-error-length',
        },
      },
    },
    company: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'organization:company-error-required',
        },
        len: {
          args: [3, 50],
          msg: 'organization:company-error-length',
        },
      },
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
    deletedAt: {
      type: DataTypes.DATE,
      defaultValue: null,
      allowNull: true,
    },
    isDeleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  };

  class OrganizationModel extends AbstractModel {
    constructor() {
      super();

      // Define the model
      this.defineModel(sequelize, 'Organization', schema);
    }

    /**
     *
     * @param data
     * @param opts
     * @returns {Promise<*>}
     */
    createNew(data, opts = {}) {
      const { User } = models;

      // Start transaction
      return this.transaction(
        async finalOpts => {
          const { transaction } = finalOpts;

          const { workspace, company, email, ...restData } = data;

          // Create organization
          const finalWorkspace = await this.getAvailableWorkspaceSlug(workspace || company);
          const createdOrganization = await this.create({ workspace: finalWorkspace, company }, finalOpts);
          // Create initial user
          const createdUser = await User.createNew(
            {
              ...restData,
              organization: createdOrganization.id,
              email,
              role: UserRoles.ADMIN,
            },
            { transaction, noEmail: true }
          );
          createdOrganization.user = createdUser.id;

          if (!opts.noEmail) {
            // Send welcome organization email
            this.sendWelcomeEmail(email, createdOrganization, createdUser);
          }

          return createdOrganization;
        },
        err => {
          throw err;
        },
        opts
      );
    }

    /**
     *
     * @param email
     * @param organization
     * @param user
     * @returns {Promise<*|boolean|undefined>}
     */
    sendWelcomeEmail(email, organization, user) {
    //   return sendEmail({
    //     template: 'welcome-organization',
    //     subject: `Welcome to ${config.get('app.name')}, ${organization.company}!`,
    //     to: email,
    //     data: {
    //       organization: {
    //         ...organization.dataValues,
    //       },
    //       user: {
    //         ...user.dataValues,
    //       },
    //     },
    //   });
    }

    /**
     *
     * @param id
     * @returns {Promise<*>}
     */
    async destroyById(id) {
      // Start transaction
      return this.transaction(
        async () => {
          const destroyOrganization = await super.destroyById(id);
          return destroyOrganization;
        },
        err => {
          throw err;
        }
      );
    }

    /**
     *
     * @param inviteToken
     * @param data
     * @param acceptIp
     * @param opts
     * @returns {Promise<*>}
     */
    async join(inviteToken, data, acceptIp, opts = {}) {
      const { User, UserInvite, EmailCheck } = models;

      const userInvite = await UserInvite.checkAcceptToken(inviteToken);
      const { organization, email, role, bussinessRole: userType } = userInvite;

      // Start transaction
      return this.transaction(
        async finalOpts => {
          const { transaction } = finalOpts;

          let updatedBy;
          if (finalOpts.user && finalOpts.user.id) {
            updatedBy = opts.user.id;
          }
          await UserInvite.Model.update(
            {
              accepted: true,
              acceptedAt: new Date(),
              acceptIp,
              updatedBy,
            },
            {
              where: {
                id: userInvite.id,
              },
              transaction,
            }
          );

          const joinedUser = await User.createNew(
            {
              ...data,
              organization,
              email,
              termsAcceptedIp: acceptIp,
              newsletterConfirmedIp: acceptIp,
              role,
              userType,
            },
            finalOpts
          );

          // Find the Data through the Email
          const checkEmail = await EmailCheck.findOne({ where: { email } });
          let creatEntry = false;
          if (checkEmail && checkEmail.expiresAt < new Date() && !checkEmail.confirmed) {
            await EmailCheck.destroyById(checkEmail.id);
            creatEntry = true;
          }
          if (!checkEmail || creatEntry) {
            await EmailCheck.create({
              email,
              requestIp: acceptIp,
              invite: true,
              confirmIp: acceptIp,
            });
          }
          return joinedUser;
        },
        err => {
          throw err;
        },
        opts
      );
    }
  }

  return new OrganizationModel();
};
