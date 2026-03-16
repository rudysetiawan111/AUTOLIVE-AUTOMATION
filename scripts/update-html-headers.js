const fs = require('fs');
const path = require('fs');

const frontendDir = path.join(__dirname, '../frontend');
const htmlFiles = fs.readdirSync(frontendDir).filter(file => file.endsWith('.html'));

// Header yang akan ditambahkan
const headerCode = `    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="AUTOLIVE - Automation platform for viral content discovery and multi-platform video publishing">
    <meta name="keywords" content="automation, viral, video, social media, content">
    <meta name="author" content="AUTOLIVE">
    
    <!-- Favicon -->
    <link rel="icon" type="image/svg+xml" href="/assets/icons/favicon.svg">
    <link rel="alternate icon" href="/assets/icons/favicon.ico">
    <link rel="apple-touch-icon" href="/assets/icons/apple-touch-icon.png">
    
    <!-- CSS -->
    <link rel="stylesheet" href="/css/style.css">
    
    <!-- Open Graph / Social Media -->
    <meta property="og:title" content="AUTOLIVE">
    <meta property="og:description" content="Automation platform for viral content discovery and multi-platform video publishing">
    <meta property="og:image" content="/assets/images/autolive-logo.png">
    <meta property="og:url" content="https://autolive.com">
    <meta name="twitter:card" content="summary_large_image">`;

let updatedCount = 0;

htmlFiles.forEach(file => {
    const filePath = path.join(frontendDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Cek apakah sudah ada meta tags
    if (!content.includes('autolive-logo') && !content.includes('favicon')) {
        // Ganti head section
        content = content.replace(
            /<head>[\s\S]*?<title>.*?<\/title>/,
            `<head>\n    <title>AUTOLIVE - ${file.replace('.html', '').charAt(0).toUpperCase() + file.replace('.html', '').slice(1)}</title>${headerCode}`
        );
        
        fs.writeFileSync(filePath, content);
        updatedCount++;
        console.log(`✅ Updated: ${file}`);
    } else {
        console.log(`⏭️ Skipped (already has meta): ${file}`);
    }
});

console.log(`\n✅ Updated ${updatedCount} HTML files`);
