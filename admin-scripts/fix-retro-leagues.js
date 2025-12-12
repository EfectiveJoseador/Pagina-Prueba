/**
 * Script para reasignar productos "retro" a sus ligas correctas
 * y añadir flag retro: true
 */
const fs = require('fs');

// Leer el archivo
let content = fs.readFileSync('js/products-data.js', 'utf-8');

// Mapeo de equipos a ligas
const TEAM_TO_LEAGUE = {
    // LaLiga
    'athletic': 'laliga', 'athletic club': 'laliga', 'athletic bilbao': 'laliga',
    'atletico madrid': 'laliga', 'atlético madrid': 'laliga',
    'barcelona': 'laliga', 'fc barcelona': 'laliga',
    'espanyol': 'laliga', 'real madrid': 'laliga',
    'real sociedad': 'laliga', 'sevilla': 'laliga',
    'valencia': 'laliga', 'villarreal': 'laliga',
    'real betis': 'laliga', 'alaves': 'laliga', 'alavés': 'laliga',

    // Premier League
    'manchester united': 'premier', 'man united': 'premier', 'man utd': 'premier',
    'manchester city': 'premier', 'man city': 'premier',
    'liverpool': 'premier', 'chelsea': 'premier',
    'arsenal': 'premier', 'tottenham': 'premier',
    'newcastle': 'premier', 'newcastle united': 'premier',
    'everton': 'premier', 'aston villa': 'premier',
    'west ham': 'premier', 'leeds': 'premier',

    // Serie A
    'ac milan': 'seriea', 'milan': 'seriea',
    'inter': 'seriea', 'inter milan': 'seriea', 'internazionale': 'seriea',
    'juventus': 'seriea', 'juve': 'seriea',
    'roma': 'seriea', 'as roma': 'seriea',
    'napoli': 'seriea', 'lazio': 'seriea',
    'fiorentina': 'seriea', 'atalanta': 'seriea',

    // Bundesliga
    'bayern': 'bundesliga', 'bayern munich': 'bundesliga', 'bayern munchen': 'bundesliga',
    'dortmund': 'bundesliga', 'borussia dortmund': 'bundesliga',
    'schalke': 'bundesliga', 'leverkusen': 'bundesliga',

    // Ligue 1
    'psg': 'ligue1', 'paris': 'ligue1', 'paris saint germain': 'ligue1',
    'marseille': 'ligue1', 'lyon': 'ligue1', 'monaco': 'ligue1',

    // Selecciones
    'españa': 'selecciones', 'spain': 'selecciones',
    'francia': 'selecciones', 'france': 'selecciones',
    'holanda': 'selecciones', 'netherlands': 'selecciones', 'holland': 'selecciones',
    'alemania': 'selecciones', 'germany': 'selecciones',
    'italia': 'selecciones', 'italy': 'selecciones',
    'brasil': 'selecciones', 'brazil': 'selecciones',
    'argentina': 'selecciones', 'mexico': 'selecciones', 'méxico': 'selecciones',
    'portugal': 'selecciones', 'england': 'selecciones', 'inglaterra': 'selecciones',

    // Brasileirao
    'flamengo': 'brasileirao', 'palmeiras': 'brasileirao',
    'corinthians': 'brasileirao', 'sao paulo': 'brasileirao', 'são paulo': 'brasileirao',
    'santos': 'brasileirao', 'gremio': 'brasileirao', 'grêmio': 'brasileirao',
    'boca juniors': 'saf', 'river plate': 'saf'
};

// Función para detectar liga basado en nombre
function detectLeague(productName) {
    const nameLower = productName.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    // Ordenar por longitud (más largo primero) para matchear "atletico madrid" antes que "atletico"
    const sortedTeams = Object.keys(TEAM_TO_LEAGUE).sort((a, b) => b.length - a.length);

    for (const team of sortedTeams) {
        const teamNorm = team.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
        if (nameLower.includes(teamNorm)) {
            return TEAM_TO_LEAGUE[team];
        }
    }
    return 'otros'; // Default si no se encuentra
}

// Buscar todos los productos con league: "retro"
const retroProductRegex = /(\{\s*id:\s*\d+,\s*name:\s*"([^"]+)"[^}]*league:\s*")retro(")/g;

let match;
let changes = 0;

while ((match = retroProductRegex.exec(content)) !== null) {
    const fullMatch = match[0];
    const productName = match[2];
    const newLeague = detectLeague(productName);

    console.log(`${productName} -> ${newLeague}`);
    changes++;
}

// Ahora hacer el reemplazo real
content = content.replace(retroProductRegex, (match, prefix, productName, suffix) => {
    const newLeague = detectLeague(productName);
    return `${prefix}${newLeague}${suffix}`;
});

// Guardar el archivo
fs.writeFileSync('js/products-data.js', content, 'utf-8');
console.log(`\nTotal cambios: ${changes}`);
console.log('Archivo guardado.');
