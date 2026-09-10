const express = require('express');
const path = require('path');
const initSqlJs = require('sql.js');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));

let db;

// Initialize Pure-JavaScript SQLite Database
initSqlJs().then(SQL => {
    db = new SQL.Database();
    db.run(`
        CREATE TABLE IF NOT EXISTS profiles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            bio TEXT,
            skills TEXT,
            github TEXT,
            linkedin TEXT
        )
    `);
    console.log("Database ready");
}).catch(err => {
    console.error("Database initialization failed:", err);
});

// Serve index.html form
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Dynamically generate and render the Profile Card
app.post('/create-profile', (req, res) => {
    try {
        const { name, bio, skills, github, linkedin } = req.body;

        const skillsArray = skills ? skills.split(',').map(s => s.trim()).filter(s => s.length > 0) : [];
        const formattedSkills = skillsArray.join(', ');

        const stmt = db.prepare(`INSERT INTO profiles (name, bio, skills, github, linkedin) VALUES (?, ?, ?, ?, ?)`);
        stmt.run([name.trim(), bio.trim(), formattedSkills, github, linkedin]);
        stmt.free();

        const skillBadges = skillsArray
            .map(skill => `<span style="background: #e0e7ff; color: #3730a3; padding: 6px 12px; border-radius: 16px; font-size: 13px; font-weight: 500;">${skill}</span>`)
            .join(' ');

        const avatarInitial = name.trim().charAt(0).toUpperCase();

        res.send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${name}'s Profile</title>
            </head>
            <body style="font-family: Arial, sans-serif; background-color: #f3f4f6; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0;">
                <div style="background: #ffffff; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); width: 350px; padding: 32px; text-align: center;">
                    <div style="width: 80px; height: 80px; background-color: #4f46e5; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: bold; margin: 0 auto 16px;">
                        ${avatarInitial}
                    </div>
                    <h2 style="margin: 0 0 8px 0; color: #111827;">${name}</h2>
                    <p style="color: #6b7280; font-size: 14px; margin-bottom: 20px; line-height: 1.4;">${bio}</p>
                    <div style="display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin-bottom: 24px;">
                        ${skillBadges}
                    </div>
                    <div style="display: flex; justify-content: center; gap: 16px; margin-bottom: 24px;">
                        ${github ? `<a href="${github}" target="_blank" style="color: #4f46e5; font-weight: bold; text-decoration: none;">GitHub</a>` : ''}
                        ${linkedin ? `<a href="${linkedin}" target="_blank" style="color: #4f46e5; font-weight: bold; text-decoration: none;">LinkedIn</a>` : ''}
                    </div>
                    <a href="/" style="color: #9ca3af; text-decoration: none; font-size: 13px;">← Create Another Profile</a>
                </div>
            </body>
            </html>
        `);
    } catch (error) {
        res.status(500).send('Error generating profile card.');
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
