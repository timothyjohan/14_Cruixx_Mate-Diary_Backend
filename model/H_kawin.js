const { Model, DataTypes } = require("sequelize");
const { getDB } = require("../conn");
const sequelize = getDB();

class H_kawin extends Model {}
H_kawin.init(
  {
    id_h_kawin: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
    },
    id_company: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    animal_fem: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    animal_male: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    id_user: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "H_kawin",
    tableName: "h_kawin",
    timestamps: false,
  }
);

module.exports = H_kawin;
