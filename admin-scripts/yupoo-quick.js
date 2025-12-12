#!/usr/bin/env node
/**
 * Quick Yupoo Import - Modo continuo
 * Uso: node yupoo-quick.js
 * Escribe 'exit' o presiona Enter sin URL para salir
 */

const { spawnSync } = require('child_process');
const readline = require('readline');
const path = require('path');

const COLORS = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    cyan: '\x1b[36m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    dim: '\x1b[2m'
};

function askForUrl(rl) {
    return new Promise(resolve => {
        rl.question(`${COLORS.cyan}URL: ${COLORS.reset}`, answer => {
            resolve(answer.trim());
        });
    });
}

async function main() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    console.log('');
    console.log(`${COLORS.bright}🚀 Yupoo Quick Import - Modo Continuo${COLORS.reset}`);
    console.log(`${COLORS.dim}Pega enlaces de Yupoo uno tras otro.${COLORS.reset}`);
    console.log(`${COLORS.dim}Escribe 'exit' o presiona Enter vacío para salir.${COLORS.reset}`);
    console.log('');

    let importCount = 0;
    const importerPath = path.join(__dirname, 'import-from-yupoo.js');

    while (true) {
        const url = await askForUrl(rl);

        // Salir si está vacío o es 'exit'
        if (!url || url.toLowerCase() === 'exit' || url.toLowerCase() === 'salir') {
            console.log('');
            console.log(`${COLORS.green}✓ ${importCount} producto(s) importado(s). ¡Hasta luego!${COLORS.reset}`);
            rl.close();
            process.exit(0);
        }

        // Validar URL
        if (!url.includes('yupoo.com')) {
            console.log(`${COLORS.yellow}⚠ URL no válida, debe ser de yupoo.com${COLORS.reset}`);
            continue;
        }

        // Ejecutar importador sincrónicamente
        console.log('');
        const result = spawnSync('node', [importerPath, url, '--list-images'], {
            stdio: 'inherit',
            cwd: path.join(__dirname, '..')
        });

        if (result.status === 0) {
            importCount++;
        }

        console.log('');
        console.log(`${COLORS.dim}─────────────────────────────────────────${COLORS.reset}`);
        console.log(`${COLORS.bright}Siguiente URL (o 'exit' para salir):${COLORS.reset}`);
    }
}

main().catch(console.error);
