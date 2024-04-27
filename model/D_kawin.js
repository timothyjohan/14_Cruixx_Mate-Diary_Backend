const { Model, DataTypes } = require("sequelize");
const { getDB } = require("../conn");
const sequelize = getDB();

class D_kawin extends Model {}
D_kawin.init(
  {
    id_d_kawin: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
    },
    id_h_kawin: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    kawin_status: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "D_kawin",
    tableName: "d_kawin",
    timestamps: false,
  }
);

module.exports = D_kawin;
