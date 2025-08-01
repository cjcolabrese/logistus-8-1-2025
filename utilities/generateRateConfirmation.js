const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const hbs = require('hbs');


function getBase64Image(imagePath) {
    try {
        const imageBuffer = fs.readFileSync(imagePath);
        const base64Image = imageBuffer.toString('base64');
        return `data:image/png;base64,${base64Image}`;
    } catch (error) {
        console.error('Error reading logo file:', error);
        return null;
    }
}
const bootstrapPath = path.join(__dirname, '..', 'public', 'stylesheets', 'bootstrap.min.css');
const bootstrapCss = fs.readFileSync(bootstrapPath, 'utf8');

// Takes template path, data context, and output path
async function generateRateConfirmationPDF(templatePath, shipment, outputPath, bootstrapPath, boostrapCss) {

    const logoPath = path.join(__dirname, '..', 'public', 'images', 'llogo.png');

    console.log(logoPath)// Since it's in root
    const logoBase64 = getBase64Image(logoPath);

    console.log('Logo Base64 (truncated):', logoBase64?.substring(0, 50));
    const templateHtml = fs.readFileSync(templatePath, 'utf8');
    const template = hbs.compile(templateHtml);
    const html = template({
        ...shipment,         // flatten it!
        logoBase64,
        bootstrapPath,
        bootstrapCss,
    });


    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.setContent(html, { waitUntil: 'networkidle0' });

    await page.pdf({
        path: outputPath,
        format: 'A4',
        printBackground: true,
        margin: { top: '20px', bottom: '30px', left: '20px', right: '20px' }
    });

    await browser.close();
}

module.exports = generateRateConfirmationPDF;
