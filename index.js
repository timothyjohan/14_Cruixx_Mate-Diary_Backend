const express = require("express")
const app = express()
app.set("port", 3000)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const { getDB } = require("./conn");
const sequelize = getDB();
const {QueryTypes} = require('sequelize');
const Joi = require('joi').extend(require('@joi/date'));
const axios = require('axios')
const api_key_ninja = "gkTS6Qheb1LyvqHe3cf9uw==o0kuQj1oopyTEmaZ"

app.post("/login", async function(req, res) {
    const {username, password} = req.body

    if(!username || !password) {
        return res.status(400).send("Field tidak boleh kosong")
    }

    const existingUserQuery = "SELECT count(*) FROM User WHERE username=:username"
    const [countExistingUser] = await sequelize.query(existingUserQuery, {
        replacements: { username },
        type: sequelize.QueryTypes.SELECT
    })

    if(countExistingUser === 0) {
        return res.status(403).send({status: 0, msg: "Username / Password salah"})
    }

    const verifyUserQuery = "SELECT count(*) FROM User WHERE username=:username AND password=:password"
    const [countVerifyUser] = await sequelize.query(verifyUserQuery, {
        replacements: { username, password },
        type: sequelize.QueryTypes.SELECT
    })

    if(countVerifyUser === 0) {
        return res.status(403).send({status: 0, msg: "Username / Password salah"})
    }

    return res.status(200).json({status: 1, msg: "Login sukses"})
})

app.post("/register", async function(req, res) {
    const {username, nickname, password, status} = req.body

    if(!username || !nickname || !password || !status) {
        return res.status(400).send("Field tidak boleh kosong")
    }

    const existingUser = "SELECT count(*) FROM User WHERE username=:username"
    const [countExistingUser] = await sequelize.query(existingUser, {
        replacements: { username },
        type: sequelize.QueryTypes.SELECT
    })

    if(countExistingUser >= 1) {
        return res.status(400).send({status: 0, msg: "Username sudah ada"})
    }

    const registerQuery = "INSERT INTO User (username, nickname, password, status) VALUES (:username, :nickname, :password, :status)"
    await sequelize.query(registerQuery, {
        replacements: { username, nickname, password, status },
        type: sequelize.QueryTypes.INSERT
    })

    return res.status(201).send({status: 1, msg: "Register sukses"})
})

app.get("/search_animal", async function(req, res) {
    const {name} = req.query

    try {
        const animalDataReq = await axios.get('https://api.api-ninjas.com/v1/animals?name=' + name, {
            headers: {
                'X-Api-Key': api_key_ninja,
            }
        })

        const animalData = animalDataReq.data
        const filteredAnimalName = {...animalData.map(data => data.name)}
        const animalNameList = Object.values(filteredAnimalName)
        if(animalNameList.length > 1) {
            console.log(animalNameList.filter(Aname => Aname.toLowerCase() === name.toLowerCase()))
            if(animalNameList.filter(Aname => Aname.toLowerCase() === name.toLowerCase()).length === 1) {
                return res.status(200).json(animalData.filter(Aname => Aname.name.toLowerCase() === name.toLowerCase()));
            }
            return res.status(200).json(animalNameList);
        } else if(animalNameList.length === 1) {
            return res.status(200).json(animalData);
        }
    } catch(e) {
        console.log(e)
    }
})

app.get("/history-breed", async function(req, res) {
    const {animal_id} = req.query

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
        ${animal_id ? 
            `
                WHERE
                    Fem_Animal.id_animal = :animal_id OR Male_Animal.id_animal = :animal_id
            ` : ''
        }
        ORDER BY 
            D_kawin.kawin_timestamp DESC
    `;

    if (animal_id) {
        const breedHistory = await sequelize.query(breedQuery, {
            replacements: { animal_id },
            type: sequelize.QueryTypes.SELECT
        });
        return res.status(200).json(breedHistory)
    } else {
        const breedHistory = await sequelize.query(breedQuery, {
            type: sequelize.QueryTypes.SELECT
        });
        return res.status(200).json(breedHistory)
    }
})

app.post("/add-animal", async function(req, res) {
    const {id_user, nama_hewan, status_is_child, nama_panggilan, kode_hewan, asal_hewan} = req.body

    if(!id_user || !nama_hewan || status_is_child === undefined) {
        return res.status(400).send("Field tidak boleh kosong")
    }

    const breedQuery = `
        INSERT INTO Animal (id_user, nama_hewan, status_is_child, nama_panggilan, kode_hewan, asal_hewan)
        VALUES (:id_user, :nama_hewan, :status_is_child, :nama_panggilan, :kode_hewan, :asal_hewan)
    `;

    await sequelize.query(breedQuery, {
        replacements: { id_user, nama_hewan, status_is_child, nama_panggilan, kode_hewan, asal_hewan },
        type: sequelize.QueryTypes.INSERT
    });
    return res.status(201).send(`Success add new animal ${nama_panggilan ? nama_panggilan : nama_hewan}`)
})

app.post("/breed", async function(req, res) {
    const {animal_a_id, animal_b_id} = req.body

    if(animal_a_id === animal_b_id) {
        return res.status(400).send("Animal yang di breed harus berbeda")
    }

    const animalAQuery = 'SELECT * FROM Animal WHERE id = :animal_a_id';
    const [animalA] = await sequelize.query(animalAQuery, {
        replacements: { animal_a_id },
        type: sequelize.QueryTypes.SELECT
    });

    const animalBQuery = 'SELECT * FROM Animal WHERE id = :animal_b_id';
    const [animalB] = await sequelize.query(animalBQuery, {
        replacements: { animal_b_id },
        type: sequelize.QueryTypes.SELECT
    });

    axios.get('https://api.api-ninjas.com/v1/animals?name=' + name, {
        headers: {
            'X-Api-Key': "gkTS6Qheb1LyvqHe3cf9uw==o0kuQj1oopyTEmaZ"
        }
    })
    .then(function (response) {
        console.log(response.data);
    })
    .catch(function (error) {
        if(error) return console.error('Request failed:', error);
        else return console.error('Error:', error.response.status, error.response.data);
    });

    return res.status(200).json({
        username: users.username,
        api_hit: users.api_hit,
        history: history
    });
})

app.listen(app.get("port"), () => {
    console.log(`Server started at http://localhost:${app.get("port")}`)
})