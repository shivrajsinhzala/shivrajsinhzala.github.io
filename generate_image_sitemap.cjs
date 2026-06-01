const fs = require('fs');
const path = require('path');

const domain = 'https://shivrajsinh.in';
const imagesDir = path.join(__dirname, 'public/assets/images');
const galleryDir = path.join(imagesDir, 'gallery');

let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
`;

// Add gallery images
if (fs.existsSync(galleryDir)) {
    xml += `  <url>\n    <loc>${domain}/gallery.html</loc>\n`;
    const files = fs.readdirSync(galleryDir);
    files.forEach(file => {
        if (file.endsWith('.webp') || file.endsWith('.jpg') || file.endsWith('.png')) {
            const title = file.replace(/-/g, ' ').replace(/\.(webp|jpg|png)$/, '');
            xml += `    <image:image>\n      <image:loc>${domain}/assets/images/gallery/${file}</image:loc>\n      <image:title>${title}</image:title>\n    </image:image>\n`;
        }
    });
    xml += `  </url>\n`;
}

// Add root images (blog covers, etc)
if (fs.existsSync(imagesDir)) {
    const files = fs.readdirSync(imagesDir);
    const blogImages = files.filter(f => (f.endsWith('.webp') || f.endsWith('.jpg')) && fs.statSync(path.join(imagesDir, f)).isFile());
    
    if (blogImages.length > 0) {
        xml += `  <url>\n    <loc>${domain}/</loc>\n`;
        blogImages.forEach(file => {
            const title = file.replace(/-/g, ' ').replace(/\.(webp|jpg|png)$/, '');
            xml += `    <image:image>\n      <image:loc>${domain}/assets/images/${file}</image:loc>\n      <image:title>${title}</image:title>\n    </image:image>\n`;
        });
        xml += `  </url>\n`;
    }
}

xml += `</urlset>`;
fs.writeFileSync(path.join(__dirname, 'public/image-sitemap.xml'), xml);
console.log('Image sitemap generated!');
