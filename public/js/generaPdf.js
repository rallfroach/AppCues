const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

async function generarDiploma(data) {
  const templatePath = path.join(__dirname, 'diploma_template.html');
  let html = fs.readFileSync(templatePath, 'utf8');

  // Reemplaza los marcadores en el HTML con los datos
  html = html.replace('{{nombreUsuario}}', data.nombreUsuario)
             .replace('{{dniUsuario}}', data.dniUsuario)
             .replace('{{tituloCuestionario}}', data.tituloCuestionario)
             .replace('{{duracion}}', data.duracion)
             .replace('{{fecha}}', data.fecha);

  // Inicializa Puppeteer
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'load' });

  // Genera el PDF
  const pdfPath = path.join(__dirname, `diploma_${data.nombreUsuario}.pdf`);
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
  });

  await browser.close();
  console.log(`PDF generado en: ${pdfPath}`);
}

module.exports = generarDiploma;
