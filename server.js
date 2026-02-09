const express = require('express')
const mysql = require('mysql2/promise')
const cors = require('cors')
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";
require('dotenv').config();
const DEMO_USER = { id: 1, username: "admin", password: "admin123" };

const port = 3000;

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 100,
    queueLimit: 0
}

const app = express();
app.use(cors({
  origin: [
    'http://localhost:3000',
  ]
}))
app.use(express.json())

app.listen(port, ()=>{
    console.log('Server running on port', port);
})

function requireAuth(req, res, next) {

    const header = req.headers.authorization; // "Bearer <token>"

    if (!header) return res.status(401).json({ error: "Missing Authorization header" });
        const [type, token] = header.split(" ");
        if (type !== "Bearer" || !token) {
            return res.status(401).json({ error: "Invalid Authorization format" });
        }
    try {
        const payload = jwt.verify(token, JWT_SECRET);
        req.user = payload;
        next();
    } catch {
    return res.status(401).json({ error: "Invalid/Expired token" });

    }

}


app.get('/allcards', async(req, res)=>{
    try{
        let connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute('SELECT * FROM defaultdb.cards');
        res.json(rows);
    } catch (err){
        console.error(err)
        res.status(500).json({message: 'Server error for allcards'});
    }
})

app.post('/addcard', requireAuth, async(req, res)=>{
    const {card_name, card_pic} = req.body;
    try{
        let connection = await mysql.createConnection(dbConfig);
        await connection.execute('INSERT INTO cards(card_name,  card_pic) VALUES (?, ?)', [card_name, card_pic]);
        res.status(201).json({message: 'Card '+card_name+ ' added successfully'})
    } catch (err){
        console.error(err)
        res.status(500).json({message: 'Server error - could not add card '+ card_name});
    }
})

app.delete('/deletecard/:id', requireAuth, async(req, res)=>{
    const {id} = req.params;
    try{
        let connection = await mysql.createConnection(dbConfig);
        await connection.execute('DELETE FROM defaultdb.cards WHERE id=' + id);
        res.status(201).json({message: 'Card '+card_name+ ' deleted successfully'})
    } catch (err){
        console.error(err)
        res.status(500).json({message: 'Server error - could not delete card '+ card_name});
    }
})

app.put('/updatecard/:id', requireAuth, async(req, res)=>{
    const {id} = req.params;
    const {card_name, card_pic} = req.body
    try{
        let connection = await mysql.createConnection(dbConfig);
        await connection.execute('UPDATE cards SET card_name=?, card_pic=? WHERE id=?', [card_name, card_pic,id]);
        res.status(201).json({message: 'Card '+card_name+ ' updated successfully'})
    } catch (err){
        console.error(err)
        res.status(500).json({message: 'Server error - could not update card '+ card_name});
    }
})

app.post("/login", (req, res) => {

    const { username, password } = req.body;

    if (username !== DEMO_USER.username || password !== DEMO_USER.password) {
        return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
        { userId: DEMO_USER.id, username: DEMO_USER.username },
        JWT_SECRET,
        { expiresIn: "1h" }
    );

    res.json({ token });

});