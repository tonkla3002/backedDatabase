const express = require('express')
const app = express()
const { Client } = require('pg')
const bodyParser = require('body-parser')
const cors = require('cors')


const port = 8000

app.use(bodyParser.json())
app.use(cors())


const client = new Client({
    host: "localhost",
    user: process.env.USER,
    port: process.env.PORT,
    password: process.env.PASSWORD,
    database: process.env.DATABASE
})


app.get('/usersRegister', async (req, res) => {
    try {
        const result = await client.query('SELECT * FROM users;')
        res.json(result.rows)
    }
    catch (error) {
        console.log('Error message:', error.message)
        res.status(500).json({
            message: "Somthing wrong"
        })
    }
})


app.post('/usersLogin', async (req, res) => {
    const { userName, password } = req.body;

    try {
        const result = await client.query(
            'SELECT * FROM users WHERE "userName" = $1',
            [userName]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({ message: 'User not found' });
        }

        const user = result.rows[0];

        // ตรวจสอบรหัสผ่าน (แนะนำให้ใช้ bcrypt ในการเข้ารหัส)
        if (user.password !== password) { // เปลี่ยนเป็นการเข้ารหัสในแอปจริง
            return res.status(401).json({ message: 'Invalid password' });
        }

        res.json({ message: 'Login successful', userName: user.userName });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});


app.post('/usersRegister', async (req, res) => {
    try {
        const { email, userName, password } = await req.body
        const result = await client.query(
            'INSERT INTO users ("email", "userName", "password")VALUES ($1,$2,$3);',
            [email, userName, password]
        )
        res.json({ message: "Post Done" })
    }
    catch (error) {
        console.log('Error message:', error.message)
        res.status(500).json({
            message: "Somthing wrong"
        })
    }
})


app.put('/UsersRegister', async (req, res) => {
    try {
        const { email, userName, password } = req.body
        const result = await client.query(
            'UPDATE users SET "email"=$1, "password"=$2 WHERE "userName" = $3;',
            [email, password, userName]
        )
        res.json({ message: "Update Done" })
    }
    catch (error) {
        console.log('Error message:', error.message)
        res.status(500).json({
            message: "Somthing wrong"
        })
    }
})


app.get('/BodyMeasurements', (req, res) => {
    const fetch_query = `SELECT 
    CASE 
    WHEN age BETWEEN 20 AND 30 THEN '20-30'
    WHEN age BETWEEN 31 AND 40 THEN '31-40'
    WHEN age BETWEEN 41 AND 50 THEN '41-50'
    WHEN age BETWEEN 51 AND 60 THEN '51-60'
    WHEN age BETWEEN 61 AND 70 THEN '61-70'
    WHEN age BETWEEN 71 AND 80 THEN '71-80'
    WHEN age BETWEEN 81 AND 90 THEN '81-90'
    ELSE 'none'
    END AS age_analys,
    
    ROUND(CAST(AVG(weight) AS numeric), 2) AS weight,
    ROUND(CAST(AVG(height) AS numeric), 2) AS height,
    ROUND(CAST(AVG(neck) AS numeric), 2) AS avg_neck,
    ROUND(CAST(AVG(chest) AS numeric), 2) AS avg_chest,
    ROUND(CAST(AVG(abdomen) AS numeric), 2) AS avg_abdomen,
    ROUND(CAST(AVG(hip) AS numeric), 2) AS avg_hip,
    ROUND(CAST(AVG(thigh) AS numeric), 2) AS avg_thigh,
    ROUND(CAST(AVG(knee) AS numeric), 2) AS avg_knee,
    ROUND(CAST(AVG(ankle) AS numeric), 2) AS avg_ankle,
    ROUND(CAST(AVG(biceps) AS numeric), 2) AS avg_biceps,
    ROUND(CAST(AVG(forearm) AS numeric), 2) AS avg_forearm,
    ROUND(CAST(AVG(wrist) AS numeric), 2) AS avg_wrist,
    ROUND(CAST(AVG(density) AS numeric), 2) AS avg_density,
    ROUND(CAST(AVG("bodyFat") AS numeric), 2) AS avg_bodyFat
    
    FROM person p
    JOIN bodymeasurements b ON p."measurementID" = b."measurementID"
    GROUP BY age_analys ORDER BY age_analys;`
    client.query(fetch_query, (err, result) => {
        if (err) {
            res.send(err)
        }
        else {
            res.send(result.rows)
        }
    })
})

app.get('/searchTop', async (req, res) => {
    let { search, category, orderby } = req.query; 

    try {
        let query = '';
        let values = [];
        console.log(category);
        search = parseFloat(search)

        console.log('Search term:', search);
        console.log('Category:', category);
        console.log('orderby:', orderby);
        
        // กรณีที่เลือกประเภท (category) และมีการค้นหา
        if (category && category !== 'all') {
         
            query = `SELECT age, weight, height, neck, chest, abdomen, hip, thigh, knee, ankle, biceps, forearm, wrist, density, "bodyFat"
                     FROM person p
                     INNER JOIN bodymeasurements b ON p."measurementID" = b."measurementID"
                     WHERE b."${category}" between ${search|0} AND ${search|0}+0.9
                     ORDER BY "${category}" ${orderby}
                     fetch first 10 rows only;` ;  // ใช้ category เป็นคอลัมน์ที่ค้นหา
                     //  WHERE b."${category}" between ${search|0}-0.1 AND ${search|0}+0.1
                     
        } else {
            // กรณีไม่มีการเลือก category (ให้แสดงค่าเฉลี่ย)
            query = `SELECT 
                        CASE 
                        WHEN age BETWEEN 20 AND 30 THEN '20-30'
                        WHEN age BETWEEN 31 AND 40 THEN '31-40'
                        WHEN age BETWEEN 41 AND 50 THEN '41-50'
                        WHEN age BETWEEN 51 AND 60 THEN '51-60'
                        WHEN age BETWEEN 61 AND 70 THEN '61-70'
                        WHEN age BETWEEN 71 AND 80 THEN '71-80'
                        WHEN age BETWEEN 81 AND 90 THEN '81-90'
                        ELSE 'none'
                        END AS age_analys,
                        
                        ROUND(CAST(AVG(weight)*0.45359 AS numeric), 2) AS avg_weight,
                        ROUND(CAST(AVG(height)*2.54 AS numeric), 2) AS avg_height,
                        ROUND(CAST(AVG(neck) AS numeric), 2) AS avg_neck,
                        ROUND(CAST(AVG(chest) AS numeric), 2) AS avg_chest,
                        ROUND(CAST(AVG(abdomen) AS numeric), 2) AS avg_abdomen,
                        ROUND(CAST(AVG(hip) AS numeric), 2) AS avg_hip,
                        ROUND(CAST(AVG(thigh) AS numeric), 2) AS avg_thigh,
                        ROUND(CAST(AVG(knee) AS numeric), 2) AS avg_knee,
                        ROUND(CAST(AVG(ankle) AS numeric), 2) AS avg_ankle,
                        ROUND(CAST(AVG(biceps) AS numeric), 2) AS avg_biceps,
                        ROUND(CAST(AVG(forearm) AS numeric), 2) AS avg_forearm,
                        ROUND(CAST(AVG(wrist) AS numeric), 2) AS avg_wrist,
                        ROUND(CAST(AVG(density) AS numeric), 2) AS avg_density,
                        ROUND(CAST(AVG("bodyFat") AS numeric), 2) AS avg_bodyFat
                     FROM person p
                     JOIN bodymeasurements b ON p."measurementID" = b."measurementID"
                     GROUP BY age_analys ORDER BY age_analys;`;

        }

        console.log('SQL Query:', query);
        // console.log('Values:', values);

        const result = await client.query(query, values);  // pool.query ถูกใช้เพื่อ query ไปยังฐานข้อมูล
        // console.log('Query result:', result.rows);  // ดูข้อมูลที่ได้จากฐานข้อมูล
        res.status(200).json(result.rows);  // ส่งข้อมูลกลับไปที่ฝั่ง frontend
    } catch (error) {
        console.error('Error executing query:', error);  // ดูข้อผิดพลาดที่เกิดขึ้น
        res.status(500).json({ message: 'Error retrieving data' });
    }
});

app.post('/userProfile',async (req, res) => {
    try {
        const { 
            userNameLocal,
            abdomen,
            ankle,
            biceps,
            bodyFat,
            chest,
            density,
            forearm,
            hip,
            knee,
            neck,
            thigh,
            wrist,
            weight,
            height,
            age} = req.body
        
        const resultUpdateUser = await client.query(
            `UPDATE users
            SET neck=${neck}, chest=${chest}, abdomen=${abdomen}, hip=${hip}, thigh=${thigh}, knee=${knee}, ankle=${ankle}, biceps=${biceps}, forearm=${forearm}, wrist=${wrist}, density=${density}, bodyFat=${bodyFat},
            weight=${weight}, height=${height},age=${age}
            WHERE "userName" = '${userNameLocal}';`
            // [neck, chest, abdomen, hip, thigh, knee, ankle, biceps, forearm, wrist, density, bodyFat,weight/0.45359, height/2.54,userNameLocal]
        )
        
        const resultInsertBody = await client.query(
            `INSERT INTO bodymeasurements
              (neck, chest, abdomen, hip, thigh, knee, ankle, biceps, forearm, wrist, density, "bodyFat")
             VALUES
              ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
             RETURNING "measurementID";`,
            [
              neck,
              chest,
              abdomen,
              hip,
              thigh,
              knee,
              ankle,
              biceps,
              forearm,
              wrist,
              density,
              bodyFat,
            ]
          );
        const measurementID = resultInsertBody.rows[0].measurementID;

        const resultInsertPerson = await client.query(
            `INSERT INTO person
            (weight, height, age, "measurementID")
           VALUES
            ($1, $2, $3, $4);`,
          [
            weight,
            height,
            age,
            measurementID,
          ]
        );

        res.json({ message: "Update Done" })
    }
    catch (error) {
        console.log('Error message:', error.message)
        res.status(500).json({
            message: error.message
        })
    }
})



app.get('/userProfile', async (req, res) => {
    let { userNameLocal } = req.query; 
    try {
        const result = await client.query(`SELECT * FROM users WHERE "userName" = $1;`,[userNameLocal]);
        res.json(result.rows[0])
    }
    catch (error) {
        console.log('Error message:', error.message)
        res.status(500).json({
            message: "Somthing wrong"
        })
    }
})


app.listen(port, async (req, res) => {
    await client.connect(async () => await console.log("connected"))
    console.log('http server run at' + port)
})
