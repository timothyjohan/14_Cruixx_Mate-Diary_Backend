const { Model, DataTypes } = require("sequelize");
const { getDB } = require("../conn");
const sequelize = getDB();

class Karyawan extends Model {}
Karyawan.init(
  {
    id_karyawan: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
    },
    id_user: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    nama_karyawan: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    no_telp: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    jabatan: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "Karyawan",
    tableName: "karyawan",
    timestamps: false,
  }
);

module.exports = Karyawan;
