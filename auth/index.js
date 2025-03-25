import express from "express";
import pg from "pg";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors())
app.use(express.json());

// PostgreSQL Client
const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
});


// Register Route
app.post("/register", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query("INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id", [email, hashedPassword]);
        res.status(201).json({ message: "User registered", userId: result.rows[0].id });
    } catch (err) {
        res.status(500).json({ error: "Error registering user", details: err.message });
    }
});

// Login Route
app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    console.log(email, password);
    
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });

        const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        if (result.rows.length === 0) return res.status(400).json({ error: "Invalid email or password" });

        const user = result.rows[0];
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) return res.status(400).json({ error: "Invalid email or password" });

        const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "24h" });
        res.json({ message: "Login successful", token });
    
});

// Start Server
app.listen(port, () => {
    console.log(`Auth server is running on port ${port}`);
});
