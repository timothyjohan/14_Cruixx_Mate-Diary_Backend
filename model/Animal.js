const { Model, DataTypes } = require("sequelize");
const { getDB } = require("../conn");
const sequelize = getDB();

class Animal extends Model {}
Animal.init(
  {
    id_animal: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
    },
    id_company: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    nama_panggilan: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    nama_hewan: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    gender: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    kode_hewan: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    asal_hewan: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status_is_child: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "Animal",
    tableName: "animal",
    timestamps: false,
  }
);

module.exports = Animal;
