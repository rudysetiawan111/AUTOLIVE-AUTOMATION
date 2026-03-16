const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

async function createAdminAuto() {
    console.log('Creating admin user automatically...');
    
    const USERS_FILE = path.join(__dirname, '../backend/data/users.json');
    const adminEmail = 'autolive1.0.0@gmail.com';
    const adminPassword = '@Rs101185';
    
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(adminPassword, salt);
        
        const adminUser = {
            id: 'admin-' + Date.now().toString(),
            fullName: 'Admin AUTOLIVE',
            email: adminEmail,
            password: hashedPassword,
            phoneNumber: '08123456789',
            preferredLanguage: 'en',
            role: 'admin',
            createdAt: new Date().toISOString()
        };
        
        let users = [];
        if (fs.existsSync(USERS_FILE)) {
            const data = fs.readFileSync(USERS_FILE, 'utf8');
            users = data ? JSON.parse(data) : [];
        }
        
        const existingAdmin = users.find(u => u.email === adminEmail);
        if (!existingAdmin) {
            users.push(adminUser);
            fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
            console.log('✅ Admin user created successfully');
        } else {
            console.log('✅ Admin user already exists');
        }
        
    } catch (error) {
        console.error('Error creating admin:', error);
    }
}

createAdminAuto();
