#!/usr/bin/env node
/**
 * Quick Yupoo Import - Solo pega el enlace y listo
 * Uso: node yupoo-quick.js [URL]
 */

const { spawn } = require('child_process');
const readline = require('readline');
const path = require('path');

const COLORS = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    cyan: '\x1b[36m',
    green: '\x1b[32m',
    dim: '\x1b[2m'
};

async function main() {
    let url = process.argv[2];

    // Si no hay URL, pedirla
    if (!url) {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        console.log('');
        console.log(`${COLORS.bright}🚀 Yupoo Quick Import${COLORS.reset}`);
        console.log(`${COLORS.dim}Pega el enlace del álbum de Yupoo:${COLORS.reset}`);
        console.log('');

        url = await new Promise(resolve => {
            rl.question(`${COLORS.cyan}URL: ${COLORS.reset}`, answer => {
                rl.close();
                resolve(answer.trim());
            });
        });
    }

    if (!url || !url.includes('yupoo.com')) {
        console.log('❌ URL de Yupoo no válida');
        process.exit(1);
    }

    // Ejecutar el importador con --list-images
    const importerPath = path.join(__dirname, 'import-from-yupoo.js');

    const child = spawn('node', [importerPath, url, '--list-images'], {
        stdio: 'inherit',
        cwd: path.join(__dirname, '..')
    });

    child.on('close', (code) => {
        process.exit(code);
    });
}

main().catch(console.error);
