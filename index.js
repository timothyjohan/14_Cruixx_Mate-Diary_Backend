const express = require("express");
const app = express();
app.set("port", 3000);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const { getDB } = require("./conn");
const sequelize = getDB();
const { QueryTypes } = require("sequelize");
const Joi = require("joi").extend(require("@joi/date"));
const axios = require("axios");

const api_key_ninja = "gkTS6Qheb1LyvqHe3cf9uw==o0kuQj1oopyTEmaZ";

// model
const User = require("./model/User");
const Karyawan = require("./model/Karyawan");
const Animal = require("./model/Animal");
const Family = require("./model/Family");
const Child = require("./model/Child");
const H_kawin = require("./model/H_kawin");
const D_kawin = require("./model/D_kawin");

// relation
User.hasMany(Karyawan, { foreignKey: "id_user" });
Karyawan.belongsTo(User, { foreignKey: "id_user" });

User.hasMany(Animal, { foreignKey: "id_user" });
Animal.belongsTo(User, { foreignKey: "id_user" });

Family.hasMany(Child, { foreignKey: "id_user" });
Child.belongsTo(Family, { foreignKey: "id_user" });

async function verifyUser(username, password) {
  //   const verifyUserQuery =
  //     "SELECT count(*) FROM User WHERE username=:username AND password=:password";
  //   const [countVerifyUser] = await sequelize.query(verifyUserQuery, {
  //     replacements: { username, password },
  //     type: sequelize.QueryTypes.SELECT,
  //   });
  let h = await User.findOne({
    where: {
      username: username,
      password: password,
    },
  });

  if (!h) {
    throw new Error("Username / Password salah");
  }

  return h;
}

app.post("/login", async function (req, res) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).send("Field tidak boleh kosong");
  }

  const existingUserQuery =
    "SELECT count(*) as jum FROM User WHERE username=:username";
  const [countExistingUser] = await sequelize.query(existingUserQuery, {
    replacements: { username },
    type: sequelize.QueryTypes.SELECT,
  });

  if (countExistingUser.jum === 0) {
    return res.status(403).send({ status: 0, msg: "Username tidak terdaftar" });
  }

  const verifyUserQuery =
    "SELECT count(*) as jum FROM User WHERE username=:username AND password=:password";
  const [countVerifyUser] = await sequelize.query(verifyUserQuery, {
    replacements: { username, password },
    type: sequelize.QueryTypes.SELECT,
  });

  if (countVerifyUser.jum === 0) {
    return res.status(403).send({ status: 0, msg: "Password salah" });
  }

  return res.status(200).json({ status: 1, msg: "Login sukses" });
});

app.post("/register", async function (req, res) {
  const { username, nickname, password, email, confirm_password } = req.body;

  if (!username || !nickname || !password || !email) {
    return res.status(400).send("Field tidak boleh kosong");
  }

  let status = "Free";

  const existingUser =
    "SELECT count(*) as jum FROM User WHERE username=:username";
  const [countExistingUser] = await sequelize.query(existingUser, {
    replacements: { username },
    type: sequelize.QueryTypes.SELECT,
  });
  console.log(countExistingUser);
  if (countExistingUser.jum >= 1) {
    return res.status(400).send({ status: 0, msg: "Username sudah ada" });
  }

  const existingEmail = "SELECT count(*) as jum FROM User WHERE email=:email";
  const [countExistingEmail] = await sequelize.query(existingEmail, {
    replacements: { email },
    type: sequelize.QueryTypes.SELECT,
  });

  if (countExistingEmail.jum >= 1) {
    return res.status(400).send({ status: 0, msg: "Email sudah ada" });
  }

  if (password !== confirm_password) {
    return res
      .status(400)
      .send({ status: 0, msg: "Password dan confirm password tidak sama" });
  }

  const registerQuery =
    "INSERT INTO User (username, nickname, email, password, status) VALUES (:username, :nickname,:email, :password, :status)";
  await sequelize.query(registerQuery, {
    replacements: { username, nickname, email, password, status },
    type: sequelize.QueryTypes.INSERT,
  });

  return res.status(201).send({ status: 1, msg: "Register sukses" });
});

app.get("/search_animal", async function (req, res) {
  const { name } = req.query;

  try {
    const animalDataReq = await axios.get(
      "https://api.api-ninjas.com/v1/animals?name=" + name,
      {
        headers: {
          "X-Api-Key": api_key_ninja,
        },
      }
    );

    const animalData = animalDataReq.data;
    const filteredAnimalName = { ...animalData.map((data) => data.name) };
    const animalNameList = Object.values(filteredAnimalName);
    if (animalNameList.length > 1) {
      console.log(
        animalNameList.filter(
          (Aname) => Aname.toLowerCase() === name.toLowerCase()
        )
      );
      if (
        animalNameList.filter(
          (Aname) => Aname.toLowerCase() === name.toLowerCase()
        ).length === 1
      ) {
        return res
          .status(200)
          .json(
            animalData.filter(
              (Aname) => Aname.name.toLowerCase() === name.toLowerCase()
            )
          );
      }
      return res.status(200).json(animalNameList);
    } else if (animalNameList.length === 1) {
      return res.status(200).json(animalData);
    }
  } catch (e) {
    console.log(e);
  }
});

// add karyawan
app.post("/karyawan", async (req, res) => {
  const { username, password, nama_karyawan, no_telp, jabatan } = req.body;
  let currUser = null;

  if (!nama_karyawan || !no_telp || !jabatan) {
    return res
      .status(400)
      .json({ status: 400, msg: "Field tidak boleh kosong" });
  }

  try {
    currUser = await verifyUser(username, password);
  } catch (error) {
    return res.status(403).send({ status: 403, msg: error.message.toString() });
  }

  let q = await Karyawan.create({
    id_user: currUser.id_user,
    nama_karyawan: nama_karyawan,
    no_telp: no_telp,
    jabatan: jabatan,
  });

  return res.status(201).json({
    status: 201,
    msg: "Berhasil add Karyawan " + nama_karyawan,
  });
});

// ambil detail all karyawan
app.get("/karyawan", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ status: 400, msg: "Field tidak boleh kosong" });
  }

  let currUser = null;
  try {
    currUser = await verifyUser(username, password);
  } catch (error) {
    return res.status(403).send({ status: 403, msg: error.message.toString() });
  }

  let h = await Karyawan.findAll({
    where: {
      id_user: currUser.id_user,
    },
  });

  return res.status(200).json({
    status: 200,
    msg: h,
  });
});

// ambil detail karyawan
app.get("/karyawan/:id", async (req, res) => {
  const { username, password } = req.body;
  const { id } = req.params;

  if (!username || !password) {
    return res
      .status(400)
      .json({ status: 400, msg: "Field tidak boleh kosong" });
  }

  let currUser = null;
  try {
    currUser = await verifyUser(username, password);
  } catch (error) {
    return res.status(403).send({ status: 403, msg: error.message.toString() });
  }

  let h = await Karyawan.findOne({
    where: {
      id_user: currUser.id_user,
      id_karyawan: id,
    },
  });

  if (!h) {
    return res.status(404).json({ status: 404, msg: "Karyawan not found" });
  }

  return res.status(200).json({
    status: 200,
    msg: h,
  });
});

app.post("/breed", async function (req, res) {
  const { animal_a_id, animal_b_id } = req.body;

  if (animal_a_id === animal_b_id) {
    return res.status(400).send("Animal yang di breed harus berbeda");
  }

  const animalAQuery = "SELECT * FROM Animal WHERE id = :animal_a_id";
  const [animalA] = await sequelize.query(animalAQuery, {
    replacements: { animal_a_id },
    type: sequelize.QueryTypes.SELECT,
  });

  const animalBQuery = "SELECT * FROM Animal WHERE id = :animal_b_id";
  const [animalB] = await sequelize.query(animalBQuery, {
    replacements: { animal_b_id },
    type: sequelize.QueryTypes.SELECT,
  });

  axios
    .get("https://api.api-ninjas.com/v1/animals?name=" + name, {
      headers: {
        "X-Api-Key": "gkTS6Qheb1LyvqHe3cf9uw==o0kuQj1oopyTEmaZ",
      },
    })
    .then(function (response) {
      console.log(response.data);
    })
    .catch(function (error) {
      if (error) return console.error("Request failed:", error);
      else
        return console.error(
          "Error:",
          error.response.status,
          error.response.data
        );
    });

  return res.status(200).json({
    username: users.username,
    api_hit: users.api_hit,
    history: history,
  });
});

app.listen(app.get("port"), () => {
  console.log(`Server started at http://localhost:${app.get("port")}`);
});
