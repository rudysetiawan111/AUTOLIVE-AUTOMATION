const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Running AUTOLIVE setup...');

// Jalankan semua script setup
try {
    console.log('1. Generating logos...');
    require('./generate-logo');
    
    console.log('2. Creating admin user...');
    require('./create-admin-auto');
    
    console.log('3. Updating HTML headers...');
    require('./update-html-headers');
    
    console.log('\n✅ Setup complete!');
    console.log('📧 Admin Email: autolive1.0.0@gmail.com');
    console.log('🔑 Admin Password: @Rs101185');
    console.log('\n🚀 Run: npm run dev');
    
} catch (error) {
    console.error('❌ Setup failed:', error);
}
