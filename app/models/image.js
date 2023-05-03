import AbstractModel from '../lib/abstract/model';

export default (sequelize, DataTypes) => {
    const schema = {
        path: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notNull: {
                    msg: 'path is required'
                }
            }
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notNull: {
                    msg: 'title is required'
                }
            }
        }
    };

    const options = {
        indexes: [],
    };

    class ImageModel extends AbstractModel {
        constructor() {
            super();

            // Define the model
            this.defineModel(sequelize, 'Image', schema, options);

            // Define the model associations
            this.defineAssociations(({ Product }) => {
                this.Model.product = this.Model.belongsTo(Product.getModel(), {
                    foreignKey: 'product',
                    onDelete: 'CASCADE',
                    onUpdate: 'CASCADE',
                });
            });
        }
    }

    return new ImageModel();
};
