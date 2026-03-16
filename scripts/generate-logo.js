const fs = require('fs');
const path = require('path');

console.log('🎨 Generating AUTOLIVE logos...');

// Buat folder jika belum ada
const assetsDir = path.join(__dirname, '../public/assets/images');
const iconsDir = path.join(__dirname, '../public/assets/icons');

if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
    console.log('✅ Created assets directory');
}

if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
    console.log('✅ Created icons directory');
}

// Buat logo utama dengan gradient
const logoSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="200" height="60" viewBox="0 0 200 60" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:#6366F1;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#8B5CF6;stop-opacity:1" />
        </linearGradient>
    </defs>
    <rect width="200" height="60" rx="12" fill="url(#grad)"/>
    <text x="25" y="40" font-family="Arial, Helvetica, sans-serif" font-size="28" fill="white" font-weight="bold">AUTO</text>
    <text x="105" y="40" font-family="Arial, Helvetica, sans-serif" font-size="28" fill="#FFD700" font-weight="bold">LIVE</text>
</svg>`;

// Buat logo kecil
const logoSmallSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="120" height="40" viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <linearGradient id="gradSmall" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:#6366F1;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#8B5CF6;stop-opacity:1" />
        </linearGradient>
    </defs>
    <rect width="120" height="40" rx="8" fill="url(#gradSmall)"/>
    <text x="15" y="26" font-family="Arial, Helvetica, sans-serif" font-size="18" fill="white" font-weight="bold">AUTO</text>
    <text x="65" y="26" font-family="Arial, Helvetica, sans-serif" font-size="18" fill="#FFD700" font-weight="bold">LIVE</text>
</svg>`;

// Buat favicon
const faviconSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <linearGradient id="gradFav" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#6366F1;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#8B5CF6;stop-opacity:1" />
        </linearGradient>
    </defs>
    <rect width="32" height="32" rx="8" fill="url(#gradFav)"/>
    <text x="6" y="22" font-family="Arial, Helvetica, sans-serif" font-size="18" fill="white" font-weight="bold">A</text>
</svg>`;

// Buat logo untuk dark mode
const logoDarkSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="200" height="60" viewBox="0 0 200 60" xmlns="http://www.w3.org/2000/svg">
    <rect width="200" height="60" rx="12" fill="#1F2937"/>
    <text x="25" y="40" font-family="Arial, Helvetica, sans-serif" font-size="28" fill="#6366F1" font-weight="bold">AUTO</text>
    <text x="105" y="40" font-family="Arial, Helvetica, sans-serif" font-size="28" fill="#8B5CF6" font-weight="bold">LIVE</text>
</svg>`;

// Buat logo putih (untuk background gelap)
const logoWhiteSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="200" height="60" viewBox="0 0 200 60" xmlns="http://www.w3.org/2000/svg">
    <rect width="200" height="60" rx="12" fill="white" opacity="0.1"/>
    <text x="25" y="40" font-family="Arial, Helvetica, sans-serif" font-size="28" fill="white" font-weight="bold">AUTO</text>
    <text x="105" y="40" font-family="Arial, Helvetica, sans-serif" font-size="28" fill="#FFD700" font-weight="bold">LIVE</text>
</svg>`;

// Tulis file
try {
    fs.writeFileSync(path.join(assetsDir, 'autolive-logo.svg'), logoSvg);
    console.log('✅ Created: autolive-logo.svg');
    
    fs.writeFileSync(path.join(assetsDir, 'autolive-logo-small.svg'), logoSmallSvg);
    console.log('✅ Created: autolive-logo-small.svg');
    
    fs.writeFileSync(path.join(iconsDir, 'favicon.svg'), faviconSvg);
    console.log('✅ Created: favicon.svg');
    
    fs.writeFileSync(path.join(assetsDir, 'autolive-logo-dark.svg'), logoDarkSvg);
    console.log('✅ Created: autolive-logo-dark.svg');
    
    fs.writeFileSync(path.join(assetsDir, 'autolive-logo-white.svg'), logoWhiteSvg);
    console.log('✅ Created: autolive-logo-white.svg');
    
    // Buat juga file PNG placeholder (untuk compatibility)
    const pngNotice = 'This is a placeholder. Replace with actual PNG logo.';
    fs.writeFileSync(path.join(assetsDir, 'autolive-logo.png'), pngNotice);
    fs.writeFileSync(path.join(assetsDir, 'autolive-logo-small.png'), pngNotice);
    
    console.log('\n✅ All logos generated successfully!');
    console.log('📁 Location: public/assets/images/ and public/assets/icons/');
    
} catch (error) {
    console.error('❌ Error generating logos:', error.message);
    process.exit(1);
}
