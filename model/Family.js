const { Model, DataTypes } = require("sequelize");
const { getDB } = require("../conn");
const sequelize = getDB();

class Family extends Model {}
Family.init(
  {
    id_fam: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
    },
    parent_fem: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    parent_male: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "Family",
    tableName: "family",
    timestamps: false,
  }
);

module.exports = Family;
