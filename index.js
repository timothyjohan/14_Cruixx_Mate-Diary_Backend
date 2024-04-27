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
const Company = require("./model/Company");
const Animal = require("./model/Animal");
const Family = require("./model/Family");
const Child = require("./model/Child");
const H_kawin = require("./model/H_kawin");
const D_kawin = require("./model/D_kawin");

// relation
Company.hasMany(User, { foreignKey: "id_company" });
User.belongsTo(Company, { foreignKey: "id_company" });

Company.hasMany(Animal, { foreignKey: "id_company" });
Animal.belongsTo(Company, { foreignKey: "id_company" });

Company.hasMany(Family, { foreignKey: "id_company" });
Family.belongsTo(Company, { foreignKey: "id_company" });

Company.hasMany(H_kawin, { foreignKey: "id_company" });
H_kawin.belongsTo(Company, { foreignKey: "id_company" });

Family.hasMany(Child, { foreignKey: "id_user" });
Child.belongsTo(Family, { foreignKey: "id_user" });

H_kawin.hasMany(D_kawin, { foreignKey: "id_h_kawin" });
D_kawin.belongsTo(H_kawin, { foreignKey: "id_h_kawin" });

// func helper

// middleware
async function verifyUser(req, res, next) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ status: 400, msg: "Username dan password tidak boleh kosong" });
  }

  let h = await User.findOne({
    where: {
      username: username,
      password: password,
    },
  });

  if (!h) {
    return res
      .status(403)
      .json({ status: 403, msg: "Username / Password salah" });
  }

  req.body.user = h;
  next();
}

// api
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
  const {
    username,
    nickname,
    password,
    email,
    company_name,
    confirm_password,
  } = req.body;

  if (!username || !nickname || !password || !email || !company_name) {
    return res.status(400).send("Field tidak boleh kosong");
  }

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

  let c = await Company.create({
    nama: company_name,
    status: "Free",
  });

  let id_comp = c.id_company;
  console.log(id_comp);

  let role = "owner";

  const registerQuery =
    "INSERT INTO User (id_company, username, nickname, email, password, role) VALUES (:id_comp, :username, :nickname,:email, :password, :role)";
  await sequelize.query(registerQuery, {
    replacements: { id_comp, username, nickname, email, password, role },
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
app.post("/karyawan", [verifyUser], async (req, res) => {
  const { nama_karyawan, username, password } = req.body;
  let currUser = req.body.user;

  if (!nama_karyawan || !no_telp || !jabatan) {
    return res
      .status(400)
      .json({ status: 400, msg: "Field tidak boleh kosong" });
  }

  let validUser = await User.findOne({
    where: {
      username: username,
    },
  });

  let validKaryawan = await Karyawan.findOne({
    where: {
      username: username,
    },
  });

  if (validUser || validKaryawan) {
    return res.status(400).json({
      status: 400,
      msg: "Username sudah dipakai",
    });
  }

  let q = await Karyawan.create({
    id_user: currUser.id_user,
    nama_karyawan: nama_karyawan,
    username: username,
    password: password,
  });

  return res.status(201).json({
    status: 201,
    msg: "Berhasil add Karyawan " + nama_karyawan,
  });
});

// ambil detail all karyawan
app.get("/karyawan", [verifyUser], async (req, res) => {
  let currUser = req.body.user;

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
app.get("/karyawan/:id", [verifyUser], async (req, res) => {
  const { id } = req.params;

  let currUser = req.body.user;

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

// add animal
app.post("/animal", [verifyUser], async (req, res) => {
  let {
    nama_panggilan,
    nama_hewan,
    gender,
    kode_hewan,
    asal_hewan,
    status_is_child,
  } = req.body;
  let currUser = req.body.user;

  if (!nama_panggilan) {
    nama_panggilan = null;
  }
  if (!asal_hewan) {
    asal_hewan = null;
  }
  //   console.log(kode_hewan, asal_hewan, nama_panggilan);
  if (!nama_hewan || !status_is_child || !gender || !kode_hewan) {
    return res
      .status(400)
      .json({ status: 400, msg: "Field tidak boleh kosong" });
  }

  let q = await Animal.create({
    id_company: currUser.id_company,
    nama_hewan: nama_hewan,
    nama_panggilan: nama_panggilan,
    gender: gender,
    kode_hewan: kode_hewan,
    asal_hewan: asal_hewan,
    status_is_child: status_is_child,
  });

  return res.status(201).json({
    status: 201,
    msg: "Berhasil add hewan " + nama_hewan,
  });
});

app.get("/animal", [verifyUser], async (req, res) => {
  let currUser = req.body.user;

  let h = await Animal.findAll({
    where: {
      id_company: currUser.id_company,
    },
  });

  return res.status(200).json({
    status: 200,
    msg: h,
  });
});

app.get("/animal/:id", [verifyUser], async (req, res) => {
  const { id } = req.params;

  let currUser = req.body.user;

  let h = await Animal.findOne({
    where: {
      id_company: currUser.id_company,
      id_animal: id,
    },
  });

  if (!h) {
    return res.status(404).json({ status: 404, msg: "Animal not found" });
  }

  return res.status(200).json({
    status: 200,
    msg: h,
  });
});

app.post("/animal/family", [verifyUser], async (req, res) => {
  const { id_male, id_fem } = req.body;

  if (!id_male || !id_fem) {
    return res
      .status(400)
      .json({ status: 400, msg: "Semua field harus diisi" });
  }

  let qm = await Animal.findOne({
    where: {
      id_animal: id_male,
      gender: "Male",
    },
  });

  let qf = await Animal.findOne({
    where: {
      id_animal: id_fem,
      gender: "Female",
    },
  });

  //   cek valid tak id nya
  if (!qm || !qf) {
    return res
      .status(404)
      .json({ status: 404, msg: "Id hewan tidak ditemukan" });
  }

  //   cek apakah udah ada fam disana
  let cek = await Family.findOne({
    where: {
      parent_fem: id_fem,
      parent_male: id_male,
    },
  });

  if (cek) {
    return res
      .status(400)
      .json({ status: 400, msg: "Family dengan 2 individu ini sudah ada" });
  }

  let currUser = req.body.user;

  let h = await Family.create({
    id_company: currUser.id_company,
    parent_fem: id_fem,
    parent_male: id_male,
  });

  return res.status(201).json({
    status: 201,
    msg: "Berhasil add family",
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
