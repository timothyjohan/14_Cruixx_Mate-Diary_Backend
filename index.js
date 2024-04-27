const express = require("express");
const cors = require("cors");

const app = express();
app.set("port", 3000);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

const { getDB } = require("./conn");
const sequelize = getDB();
const { QueryTypes, where } = require("sequelize");
const Joi = require("joi").extend(require("@joi/date"));
const axios = require("axios");
const api_key_ninja = "gkTS6Qheb1LyvqHe3cf9uw==o0kuQj1oopyTEmaZ";

// model
const User = require("./model/User");
const Company = require("./model/Company");
const Animal = require("./model/Animal");
const D_kawin = require("./model/D_kawin");
const H_kawin = require("./model/H_kawin");

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

function selisih(tgl) {
  // let tgl_user = new Date(parseStringToDate(tgl));
  let tgl_kelahiran = new Date(tgl);
  let currDate = new Date();
  // Menghitung selisih dalam hari
  let differenceInDays = (tgl_kelahiran - currDate) / (1000 * 60 * 60 * 24);
  //   supaya jadi 00:00:00

  return parseInt(differenceInDays);
}

// middleware
async function verifyUser(req, res, next) {
  const { username, password } = req.query;

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

  req.query.user = h;
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

app.post("/user", async (req, res) => {
  const { username } = req.query;

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
    // return res.status(200).json(animalNameList);
  } catch (e) {
    console.log(e);
  }
});

// add karyawan
app.post("/karyawan", [verifyUser], async (req, res) => {
  const { nickname, username, password } = req.body;

  if (!nickname || !username || !password) {
    return res.status(400).json({
      status: 400,
      msg: "Semua field harus diisi",
    });
  }
  let currUser = req.query.user;

  let validUser = await User.findOne({
    where: {
      username: username,
    },
  });

  if (validUser) {
    return res.status(400).json({
      status: 400,
      msg: "Username sudah dipakai",
    });
  }

  let q = await Karyawan.create({
    id_company: currUser.id_company,
    username: username,
    password: password,
    nickname: nickname,
    email: "-",
    role: "PEGAWAI",
  });

  return res.status(201).json({
    status: 201,
    msg: "Berhasil add Karyawan " + nickname,
  });
});

// ambil detail all karyawan
app.get("/karyawan", [verifyUser], async (req, res) => {
  let currUser = req.query.user;

  let h = await User.findAll({
    where: {
      id_company: currUser.id_company,
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

  let currUser = req.query.user;

  let h = await User.findOne({
    where: {
      id_company: currUser.id_company,
      id_user: id,
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
  let currUser = req.query.user;

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
        gender: "FEMALE",
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
        gender: "MALE",
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
  let currUser = req.query.user;

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

  let currUser = req.query.user;

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

  let currUser = req.query.user;

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
  let currUser = req.query.user;

  if (!animal_fem || !animal_male) {
    return res
      .status(404)
      .json({ status: 404, msg: "Semua field wajib diisi" });
  }

  let pf = await Animal.findOne({
    where: {
      id_company: currUser.id_company,
      id_animal: animal_fem,
      gender: "FEMALE",
    },
  });

  if (!pf) {
    return res.status(400).json({
      status: 400,
      msg: "id animal parent female yang dimasukkan tidak valid",
    });
  }

  let pm = await Animal.findOne({
    where: {
      id_company: currUser.id_company,
      id_animal: animal_male,
      gender: "MALE",
    },
  });

  if (!pm) {
    return res.status(400).json({
      status: 400,
      msg: "id animal parent male yang dimasukkan tidak valid",
    });
  }

  let animal = await getAnimalByID(currUser.id_company, animal_fem);

  let ax = await axios({
    url: "https://api.api-ninjas.com/v1/animals?name=" + animal.nama_hewan,
    headers: {
      "X-Api-Key": api_key_ninja,
    },
  });

  let lamaWkt = ax.data[0].characteristics.gestation_period.split(" ")[0];
  lamaWkt = parseInt(lamaWkt);

  let wktLahir = new Date();
  wktLahir.setDate(wktLahir.getDate() + lamaWkt);

  let h_kawin = await H_kawin.create({
    id_company: currUser.id_company,
    id_user: currUser.id_user,
    animal_fem: animal_fem,
    animal_male: animal_male,
    status: "BEFORE",
    tgl_kelahiran: wktLahir,
    durasi_hamil: lamaWkt,
  });

  let d_kawin = await D_kawin.create({
    id_h_kawin: h_kawin.id_h_kawin,
    kawin_status: 0,
    waktu_kawin: new Date(),
  });

  return res.status(201).json({
    status: 201,
    msg: "Add history success",
  });
});

app.get("/history", [verifyUser], async (req, res) => {
  let currUser = req.query.user;

  let q = await H_kawin.findAll({
    where: {
      id_company: currUser.id_company,
    },
  });

  let hasil = [];

  for (let i = 0; i < q.length; i++) {
    const e = q[i];

    let fem = await getAnimalByID(currUser.id_company, e.animal_fem);
    let male = await getAnimalByID(currUser.id_company, e.animal_male);

    hasil.push({
      id_h_kawin: e.id_h_kawin,
      user: currUser.nickname,
      animal_fem: fem.nama_panggilan,
      animal_male: male.nama_panggilan,
      status: e.status,
      durasi_hamil: e.durasi_hamil,
      tgl_kelahiran: e.tgl_kelahiran,
    });
  }

  return res.status(200).json({
    status: 200,
    msg: hasil,
  });
});

app.get("/history/details", [verifyUser], async (req, res) => {
  let currUser = req.query.user;

  let q = await D_kawin.findAll({
    where: {
      id_company: currUser.id_company,
    },
  });

  return res.status(200).json({
    status: 200,
    msg: q,
  });
});

app.post("/history/details", [verifyUser], async (req, res) => {
  const { id_h_kawin } = req.query;
  let currUser = req.query.user;

  if (!id_h_kawin) {
    return res.status(400).json({
      status: 400,
      msg: "semua field wajib diisi",
    });
  }

  let q = await D_kawin.create({
    id_h_kawin: id_h_kawin,
    kawin_status: 0,
    waktu_kawin: new Date(),
  });

  return res.status(200).json({
    status: 200,
    msg: "berhasil add d kawin",
  });
});

app.put("/history/details", [verifyUser], async (req, res) => {
  let { id_h_kawin, status, id_d_kawin } = req.query;

  let currUser = req.query.user;

  if (!id_d_kawin || !id_h_kawin || !status) {
    return res.status(200).json({
      status: 200,
      msg: "semua field wajib diisi",
    });
  }

  status = parseInt(status);

  let d_kawin = await D_kawin.findOne({
    where: {
      id_h_kawin: id_h_kawin,
      id_d_kawin: id_d_kawin,
    },
  });

  let h_kawin = await H_kawin.findOne({
    where: {
      id_company: currUser.id_company,
      id_h_kawin: id_h_kawin,
    },
  });

  let cd = -1;
  if (status == 1) {
    cd = selisih(h_kawin.tgl_kelahiran);
  }

  d_kawin.update({
    kawin_status: status,
  });

  return res.status(200).json({
    status: 200,
    msg: "berhasil update d kawin",
    cd: cd,
  });
});

app.listen(app.get("port"), () => {
  console.log(`Server started at http://localhost:${app.get("port")}`);
});
