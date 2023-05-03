import AbstractModel from '../lib/abstract/model';

export default (sequelize, DataTypes) => {
    const schema = {
        title: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notNull: {
                    msg: 'product title is required'
                }
            }
        },
        dercription: {
            type: DataTypes.TEXT,
            allowNull: false,
            validate: {
                notNull: {
                    msg: 'product dercription is required',
                },
            },
        },
        price: {
            type: DataTypes.FLOAT,
            allowNull: false,
            validate: {
                notNull: {
                    msg: 'Price is required'
                }
            }
        },
        stock: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
    };

    const options = {
        indexes: [],
    };

    class ProductModel extends AbstractModel {
        constructor() {
            super();

            // Define the model
            this.defineModel(sequelize, 'Product', schema, options);

            // Define the model associations
            this.defineAssociations(({ User, Image }) => {
                this.Model.user = this.Model.belongsTo(User.getModel(), {
                    foreignKey: 'user',
                    onDelete: 'CASCADE',
                    onUpdate: 'CASCADE',
                });
            });
        }
    }

    return new ProductModel();
};
