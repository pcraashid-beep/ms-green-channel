const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 5000;
const SECRET_KEY = "MSGCPPL_SUPER_SECRET_KEY"; // Change this in production

app.use(cors());
app.use(bodyParser.json());

// Mock Database (In a real app, use MongoDB or MySQL)
const users = [
    { id: 1, username: "staff1", password: "", role: "employee" },
    { id: 2, username: "manager1", password: "", role: "management" }
];

// Pre-hashing passwords for our mock database
users.forEach(async (u) => { u.password = await bcrypt.hash("password123", 10); });

// --- AUTHENTICATION API ---
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username);

    if (user && await bcrypt.compare(password, user.password)) {
        const token = jwt.sign(
            { id: user.id, role: user.role }, 
            SECRET_KEY, 
            { expiresIn: '2h' }
        );
        return res.json({ success: true, token, role: user.role });
    }
    res.status(401).json({ success: false, message: "Invalid Credentials" });
});

// --- MIDDLEWARE: Check Roles ---
const authorize = (role) => {
    return (req, res, next) => {
        const token = req.headers['authorization']?.split(' ')[1];
        if (!token) return res.status(403).send("Access Denied");

        jwt.verify(token, SECRET_KEY, (err, decoded) => {
            if (err || (role && decoded.role !== role)) {
                return res.status(401).send("Unauthorized Access");
            }
            req.user = decoded;
            next();
        });
    };
};

// --- SEPARATE APIs ---

// 1. General Employee API (Can be accessed by both)
app.get('/api/employee/dashboard', authorize('employee'), (req, res) => {
    res.json({ message: "Welcome to the Staff Portal", announcements: ["Site B safety drill on Friday"] });
});

// 2. Project Management API (Authorized Personnel Only)
app.get('/api/management/reports', authorize('management'), (req, res) => {
    res.json({ 
        message: "Management Console", 
        financials: "Confidential: $2.4M Budget remaining",
        approvalRequests: 5 
    });
});

app.listen(PORT, () => console.log(`MS Green Channel Server running on port ${PORT}`));
// Mock Database for Projects
let projectDb = [
    { id: 1, name: "Upper River Hydro", location: "Doda, J&K", progress: 65, budget: "1.2 Cr" }
];

// API to add a new project (Only for Management)
app.post('/api/projects/add', authorize('management'), (req, res) => {
    const newProject = {
        id: projectDb.length + 1,
        name: req.body.name,
        location: req.body.location,
        progress: req.body.progress,
        budget: req.body.budget
    };
    projectDb.push(newProject);
    res.json({ success: true, message: "Project added successfully!", projectDb });
});