const express = require("express");
const cors = require("cors");

const app = express();
app.set("port", 3000);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

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
const H_kawin = require("./model/H_kawin");
const D_kawin = require("./model/D_kawin");

// relation
Company.hasMany(User, { foreignKey: "id_company" });
User.belongsTo(Company, { foreignKey: "id_company" });

Company.hasMany(Animal, { foreignKey: "id_company" });
Animal.belongsTo(Company, { foreignKey: "id_company" });

Company.hasMany(H_kawin, { foreignKey: "id_company" });
H_kawin.belongsTo(Company, { foreignKey: "id_company" });

H_kawin.hasMany(D_kawin, { foreignKey: "id_h_kawin" });
D_kawin.belongsTo(H_kawin, { foreignKey: "id_h_kawin" });

// func helper
async function getAnimalByID(id_comp, id_animal) {
  let h = await Animal.findOne({
    where: {
      id_company: id_comp,
      id_animal: id_animal,
    },
  });

  return h;
}

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

app.get("/user", async (req, res) => {
  const { username } = req.body;

  let h = await User.findOne({
    where: {
      username: username,
    },
  });

  return res.status(200).json({
    status: 200,
    msg: h,
  });
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
    parent_fem,
    parent_male,
  } = req.body;
  let currUser = req.body.user;

  if (!nama_panggilan) {
    nama_panggilan = null;
  }
  if (!asal_hewan) {
    asal_hewan = null;
  }

  if (!parent_fem) {
    parent_fem = null;
  }

  if (!parent_male) {
    parent_male = null;
  }

  //   console.log(kode_hewan, asal_hewan, nama_panggilan);
  if (!nama_hewan || !gender || !kode_hewan) {
    return res
      .status(400)
      .json({ status: 400, msg: "Field tidak boleh kosong" });
  }

  //   pengecekan kode hewan hrs unik
  let cek_kode = await Animal.findOne({
    where: {
      id_company: currUser.id_company,
      kode_hewan: kode_hewan,
    },
  });

  if (cek_kode) {
    return res
      .status(400)
      .json({ status: 400, msg: "Kode hewan tidak boleh kembar" });
  }

  let status_is_child = 0;
  if (parent_fem || parent_male) {
    status_is_child = 1;
  }

  if (parent_fem) {
    let pf = await Animal.findOne({
      where: {
        id_company: currUser.id_company,
        id_animal: parent_fem,
        gender: "Female",
      },
    });

    if (!pf) {
      return res.status(400).json({
        status: 400,
        msg: "id animal parent female yang dimasukkan tidak valid",
      });
    }
  }

  if (parent_male) {
    let pm = await Animal.findOne({
      where: {
        id_company: currUser.id_company,
        id_animal: parent_male,
        gender: "Male",
      },
    });

    if (!pm) {
      return res.status(400).json({
        status: 400,
        msg: "id animal parent male yang dimasukkan tidak valid",
      });
    }
  }

  let q = await Animal.create({
    id_company: currUser.id_company,
    nama_hewan: nama_hewan,
    nama_panggilan: nama_panggilan,
    gender: gender,
    kode_hewan: kode_hewan,
    asal_hewan: asal_hewan,
    status_is_child: status_is_child,
    parent_fem: parent_fem,
    parent_male: parent_male,
  });

  return res.status(201).json({
    status: 201,
    msg: "Berhasil add hewan " + nama_hewan,
  });
});

app.get("/animal", [verifyUser], async (req, res) => {
  const { gender, nickname, nama_hewan } = req.query;
  let currUser = req.body.user;

  let h = await Animal.findAll({
    where: {
      id_company: currUser.id_company,
    },
  });

  if (gender) {
    h = h.filter((u) => u.gender == gender);
  }

  if (nickname) {
    h = h.filter((u) =>
      u.nama_panggilan.toLowerCase().includes(nickname.toLowerCase())
    );
  }

  if (nama_hewan) {
    h = h.filter((u) => u.nama_hewan.toLowerCase() == nama_hewan.toLowerCase());
  }

  return res.status(200).json({
    status: 200,
    msg: h,
  });
});

app.get("/animal/family/:id", [verifyUser], async (req, res) => {
  const { id } = req.params;

  let currUser = req.body.user;

  let child = await getAnimalByID(currUser.id_company, id);

  if (!child) {
    return res.status(404).json({ status: 404, msg: "Animal not found" });
  }

  let parent_fem = await getAnimalByID(currUser.id_company, child.parent_fem);
  let parent_male = await getAnimalByID(currUser.id_company, child.parent_male);

  let nenek_parent_fem = null;
  let kakek_parent_fem = null;
  if (parent_fem) {
    nenek_parent_fem = await getAnimalByID(
      currUser.id_company,
      parent_fem.parent_fem
    );
    kakek_parent_fem = await getAnimalByID(
      currUser.id_company,
      parent_fem.parent_male
    );
  }

  let nenek_parent_male = null;
  let kakek_parent_male = null;
  if (parent_male) {
    nenek_parent_male = await getAnimalByID(
      currUser.id_company,
      parent_male.parent_fem
    );
    kakek_parent_male = await getAnimalByID(
      currUser.id_company,
      parent_male.parent_male
    );
  }

  return res.status(200).json({
    status: 200,
    msg: {
      anak: child,
      ibu: parent_fem,
      ayah: parent_male,
      nenek_ibu: nenek_parent_fem,
      kakek_ibu: kakek_parent_fem,
      nenek_ayah: nenek_parent_male,
      kakek_ayah: kakek_parent_male,
    },
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

app.post("/history", [verifyUser], async function (req, res) {
  const { animal_fem, animal_male } = req.body;
  let currUser = req.body.user;

  res.send("POST request to the homepage");
});

app.get("/history", async (req, res) => {
  res.send("GET request to the homepage");
});

app.get("/history-breed", async function (req, res) {
  const { animal_id } = req.query;

  const breedQuery = `
        SELECT 
            D_kawin.kawin_status AS Breed_Status,
            Fem_Animal.nama_hewan AS Female_Animal_Name,
            Fem_Animal.nama_panggilan AS Female_Animal_Nickname,
            Male_Animal.nama_hewan AS Male_Animal_Name,
            Male_Animal.nama_panggilan AS Male_Animal_Nickname,
            User.nickname AS User_Nickname
        FROM 
            H_kawin
        JOIN 
            D_kawin ON H_kawin.id_h_kawin = D_kawin.id_session
        JOIN 
            Animal AS Fem_Animal ON H_kawin.animal_fem = Fem_Animal.id_animal
        JOIN 
            Animal AS Male_Animal ON H_kawin.animal_male = Male_Animal.id_animal
        JOIN 
            User ON H_kawin.id_user = User.id_user
        ${
          animal_id
            ? `
                WHERE
                    Fem_Animal.id_animal = :animal_id OR Male_Animal.id_animal = :animal_id
            `
            : ""
        }
        ORDER BY 
            D_kawin.kawin_timestamp DESC
    `;

  if (animal_id) {
    const breedHistory = await sequelize.query(breedQuery, {
      replacements: { animal_id },
      type: sequelize.QueryTypes.SELECT,
    });
    return res.status(200).json(breedHistory);
  } else {
    const breedHistory = await sequelize.query(breedQuery, {
      type: sequelize.QueryTypes.SELECT,
    });
    return res.status(200).json(breedHistory);
  }
});

app.post("/add-animal", async function (req, res) {
  const {
    id_user,
    nama_hewan,
    status_is_child,
    nama_panggilan,
    kode_hewan,
    asal_hewan,
  } = req.body;

  if (!id_user || !nama_hewan || status_is_child === undefined) {
    return res.status(400).send("Field tidak boleh kosong");
  }

  const breedQuery = `
        INSERT INTO Animal (id_user, nama_hewan, status_is_child, nama_panggilan, kode_hewan, asal_hewan)
        VALUES (:id_user, :nama_hewan, :status_is_child, :nama_panggilan, :kode_hewan, :asal_hewan)
    `;

  await sequelize.query(breedQuery, {
    replacements: {
      id_user,
      nama_hewan,
      status_is_child,
      nama_panggilan,
      kode_hewan,
      asal_hewan,
    },
    type: sequelize.QueryTypes.INSERT,
  });
  return res
    .status(201)
    .send(
      `Success add new animal ${nama_panggilan ? nama_panggilan : nama_hewan}`
    );
});

app.listen(app.get("port"), () => {
  console.log(`Server started at http://localhost:${app.get("port")}`);
});
