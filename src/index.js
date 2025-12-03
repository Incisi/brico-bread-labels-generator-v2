const { app, BrowserWindow, ipcMain, shell } = require('electron');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const isDev = !app.isPackaged;

const LABEL_WIDTH_MM = 65;
const LABEL_HEIGHT_MM = 35;
const LABEL_WIDTH_PT = LABEL_WIDTH_MM * 2.83465;
const LABEL_HEIGHT_PT = LABEL_HEIGHT_MM * 2.83465;

const BG_IMAGE_PATH = isDev
    ? path.join(__dirname, 'media', 'etiqueta.png')
    : path.join(process.resourcesPath, 'media', 'etiqueta.png');

const NEW_BANNER_PATH = isDev
    ? path.join(__dirname, 'media', 'faixa.png')
    : path.join(process.resourcesPath, 'media', 'faixa.png');

const FONT_PRODUCT_NAME = isDev
    ? path.join(__dirname, 'fonts', 'Lato-Black.ttf')
    : path.join(process.resourcesPath, 'fonts', 'Lato-Black.ttf');

const FONT_PRICE = isDev
    ? path.join(__dirname, 'fonts', 'Gotham-Black.otf')
    : path.join(process.resourcesPath, 'fonts', 'Gotham-Black.otf');

const FONT_MEASURE = isDev
    ? path.join(__dirname, 'fonts', 'DancingScript-Bold.ttf')
    : path.join(process.resourcesPath, 'fonts', 'DancingScript-Bold.ttf');

const WHITE = '#FFFFFF';
const GEMA_YELLOW = '#FCD900';

const appDocDir = path.join(app.getPath('documents'), 'Gerador de Etiquetas');
const dataDir = isDev ? path.join(__dirname, 'data') : path.join(appDocDir, 'data');
const backupsDir = isDev ? path.join(__dirname, 'backups') : path.join(appDocDir, 'backups');
const configPath = isDev ? path.join(__dirname, 'config.json') : path.join(appDocDir, 'config.json');

[appDocDir, dataDir, backupsDir].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

if (!isDev && !fs.existsSync(configPath)) {
    const initialConfig = { stores: [{ id: 'matriz', name: 'Cotia' }] };
    fs.writeFileSync(configPath, JSON.stringify(initialConfig, null, 2));
}

function createWindow() {
    const win = new BrowserWindow({
        width: 1280,
        height: 900,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });
    win.loadFile('index.html');
}

app.on('ready', createWindow);

app.commandLine.appendSwitch('no-sandbox');
app.disableHardwareAcceleration();

function getStoreFilePath(storeId) {
    const safeId = storeId.replace(/[^a-z0-9-_]/gi, '');
    return path.join(dataDir, `${safeId}.json`);
}

function validateProducts(products) {
    if (!Array.isArray(products)) return false;
    return products.every(p =>
        typeof p.codigo === 'string' &&
        typeof p.nome === 'string' &&
        typeof p.preco === 'number'
    );
}

function performBackup(storeId, filePath) {
    if (!fs.existsSync(filePath)) return;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupsDir, `${storeId}_${timestamp}.json`);
    fs.copyFileSync(filePath, backupPath);

    const files = fs.readdirSync(backupsDir).filter(f => f.startsWith(storeId));
    if (files.length > 5) {
        files.sort((a, b) => {
            return fs.statSync(path.join(backupsDir, a)).mtime.getTime() -
                fs.statSync(path.join(backupsDir, b)).mtime.getTime();
        });
        while (files.length > 5) {
            fs.unlinkSync(path.join(backupsDir, files.shift()));
        }
    }
}

ipcMain.handle('load-config', async () => {
    if (fs.existsSync(configPath)) {
        return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    }
    return { stores: [] };
});

ipcMain.handle('save-config', async (event, newConfig) => {
    fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2));
    return true;
});

ipcMain.handle('load-data', async (event, storeId) => {
    const filePath = getStoreFilePath(storeId);
    if (fs.existsSync(filePath)) {
        return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
    return [];
});

ipcMain.handle('save-data', async (event, { products, storeId }) => {
    if (!validateProducts(products)) {
        throw new Error("Dados inválidos. Verifique a integridade dos produtos.");
    }

    const filePath = getStoreFilePath(storeId);
    performBackup(storeId, filePath);
    fs.writeFileSync(filePath, JSON.stringify(products, null, 2));
    return true;
});

ipcMain.handle('generate-labels', async (event, products) => {
    const doc = new PDFDocument({ size: 'A4', margin: 0 });
    const outputPath = isDev ? path.join(__dirname, 'etiquetas') : path.join(appDocDir, 'etiquetas');

    if (!fs.existsSync(outputPath)) fs.mkdirSync(outputPath, { recursive: true });

    const fullFilePath = path.join(outputPath, `etiquetas_${new Date().toISOString().slice(0, 10)}.pdf`);
    const writeStream = fs.createWriteStream(fullFilePath);

    doc.pipe(writeStream);
    doc.registerFont('ProductName', FONT_PRODUCT_NAME);
    doc.registerFont('Price', FONT_PRICE);
    doc.registerFont('Measure', FONT_MEASURE);

    const startX = 40;
    const startY = 40;
    const gapX = 10;
    const gapY = 10;
    const labelsPerLine = 2;

    let x = startX;
    let y = startY;
    let labelsOnLine = 0;

    for (const product of products) {
        if (labelsOnLine >= labelsPerLine) {
            x = startX;
            y += LABEL_HEIGHT_PT + gapY;
            labelsOnLine = 0;
        }

        if (y + LABEL_HEIGHT_PT > doc.page.height - startY) {
            doc.addPage();
            x = startX;
            y = startY;
            labelsOnLine = 0;
        }

        doc.image(BG_IMAGE_PATH, x, y, { width: LABEL_WIDTH_PT, height: LABEL_HEIGHT_PT });

        if (product.isNew) {
            doc.image(NEW_BANNER_PATH, x, y, { width: LABEL_WIDTH_PT });
        }

        const productNameY = y + 4;
        const priceY = y + 36;
        const measureY = y + 80;
        const lineHeight = 15;

        const productNameLines = breakLines(product.nome, 23);
        productNameLines.forEach((line, lineIndex) => {
            doc.font('ProductName').fontSize(14).fillColor(WHITE).text(line, x, productNameY + (lineIndex * lineHeight), {
                width: LABEL_WIDTH_PT, align: 'center'
            });
        });

        const priceText = `R$ ${product.preco.toFixed(2).replace('.', ',')}`;
        doc.font('Price').fontSize(36).fillColor(GEMA_YELLOW).text(priceText, x, priceY, {
            width: LABEL_WIDTH_PT, align: 'center'
        });

        doc.font('Measure').fontSize(12).fillColor(GEMA_YELLOW).text(product.medida, x, measureY, {
            width: LABEL_WIDTH_PT, align: 'center'
        });

        x += LABEL_WIDTH_PT + gapX;
        labelsOnLine++;
    }

    doc.end();
    await new Promise(resolve => writeStream.on('finish', resolve));
    shell.showItemInFolder(fullFilePath);
    return 'PDF generated successfully';
});

function breakLines(text, maxLineLength) {
    const words = text.split(' ');
    let currentLine = '';
    const lines = [];

    words.forEach(word => {
        if (word.length > maxLineLength) {
            if (currentLine.length > 0) lines.push(currentLine);
            lines.push(word);
            currentLine = '';
            return;
        }
        const potentialLine = currentLine.length === 0 ? word : `${currentLine} ${word}`;
        if (potentialLine.length > maxLineLength) {
            lines.push(currentLine);
            currentLine = word;
        } else {
            currentLine = potentialLine;
        }
    });
    if (currentLine.length > 0) lines.push(currentLine);
    return lines;
}