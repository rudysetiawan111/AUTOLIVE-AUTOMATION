const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const USERS_FILE = path.join(__dirname, '../backend/data/users.json');

async function createAdmin() {
    console.log('\n🔐 Create Admin User\n');
    
    // Default admin credentials
    const defaultEmail = 'autolive1.0.0@gmail.com';
    const defaultPassword = '@Rs101185';
    
    rl.question(`Email (default: ${defaultEmail}): `, (email) => {
        rl.question(`Password (default: ${defaultPassword}): `, async (password) => {
            
            const adminEmail = email || defaultEmail;
            const adminPassword = password || defaultPassword;
            
            try {
                // Hash password
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(adminPassword, salt);
                
                // Buat admin user object
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
                
                // Baca users existing
                let users = [];
                if (fs.existsSync(USERS_FILE)) {
                    const data = fs.readFileSync(USERS_FILE, 'utf8');
                    users = data ? JSON.parse(data) : [];
                }
                
                // Cek apakah admin sudah ada
                const existingAdmin = users.find(u => u.email === adminEmail);
                if (existingAdmin) {
                    console.log('\n❌ Admin user already exists!');
                    console.log('📧 Email:', adminEmail);
                } else {
                    users.push(adminUser);
                    
                    // Save ke file
                    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
                    
                    console.log('\n✅ Admin user created successfully!');
                    console.log('📧 Email:', adminEmail);
                    console.log('🔑 Password:', adminPassword);
                    console.log('\n📍 You can now login with these credentials.');
                    
                    // Save to .env also
                    const envPath = path.join(__dirname, '../.env');
                    if (fs.existsSync(envPath)) {
                        let envContent = fs.readFileSync(envPath, 'utf8');
                        if (!envContent.includes('ADMIN_EMAIL')) {
                            envContent += `\n# Admin User\nADMIN_EMAIL=${adminEmail}\nADMIN_PASSWORD=${adminPassword}\n`;
                            fs.writeFileSync(envPath, envContent);
                            console.log('✅ Admin credentials added to .env');
                        }
                    }
                }
                
            } catch (error) {
                console.error('❌ Error creating admin:', error);
            }
            
            rl.close();
        });
    });
}

createAdmin();
