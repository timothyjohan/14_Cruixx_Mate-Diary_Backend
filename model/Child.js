const { Model, DataTypes } = require("sequelize");
const { getDB } = require("../conn");
const sequelize = getDB();

class Child extends Model {}
Child.init(
  {
    id_child: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
    },
    id_fam: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "Child",
    tableName: "child",
    timestamps: false,
  }
);

module.exports = Child;
