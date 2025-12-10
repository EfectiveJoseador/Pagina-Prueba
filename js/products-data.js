

const products = [
    {
        id: 101,
        name: "Alavés 25/26 Local",
        category: "futbol",
        league: "laliga",
        price: 79.99,
        image: "/assets/productos/La Liga/Alaves2526L/1.webp",
        new: true,
        sale: false
    },
    {
        id: 102,
        name: "Albacete 25/26 Local",
        category: "futbol",
        league: "laliga",
        price: 79.99,
        image: "/assets/productos/La Liga/Albacete2526L/1.webp",
        new: true,
        sale: false
    },
    {
        id: 103,
        name: "Athletic Club 25/26 Tercera (Kids)",
        category: "futbol",
        league: "laliga",
        price: 64.99,
        image: "/assets/productos/La Liga/AthelticKids2526T/1.webp",
        new: true,
        sale: false,
        kids: true
    },
    {
        id: 104,
        name: "Athletic Club 01/03 Visitante Retro",
        category: "futbol",
        league: "retro",
        price: 89.99,
        image: "/assets/productos/La Liga/Athletic0103FR/1.webp",
        new: false,
        sale: false,
        retro: true
    },
    {
        id: 105,
        name: "Athletic Club 25/26 Local",
        category: "futbol",
        league: "laliga",
        price: 79.99,
        image: "/assets/productos/La Liga/Athletic2526L/1.webp",
        new: true,
        sale: false
    },
    {
        id: 106,
        name: "Atlético Madrid 02/03 Local Retro",
        category: "futbol",
        league: "retro",
        price: 89.99,
        image: "/assets/productos/La Liga/Atletico0203LR/1.webp",
        new: false,
        sale: false,
        retro: true
    },
    {
        id: 107,
        name: "Atlético Madrid 25/26 Visitante",
        category: "futbol",
        league: "laliga",
        price: 79.99,
        image: "/assets/productos/La Liga/Atletico2526F/1.webp",
        new: true,
        sale: false
    },
    {
        id: 108,
        name: "Atlético Madrid 25/26 Local",
        category: "futbol",
        league: "laliga",
        price: 79.99,
        image: "/assets/productos/La Liga/Atletico2526L/1.webp",
        new: true,
        sale: false
    },
    {
        id: 109,
        name: "Atlético Madrid 95/96 Tercera Retro",
        category: "futbol",
        league: "retro",
        price: 89.99,
        image: "/assets/productos/La Liga/Atletico9596TR/1.webp",
        new: false,
        sale: false,
        retro: true
    },
    {
        id: 110,
        name: "Atlético Madrid 25/26 Visitante (Kids)",
        category: "futbol",
        league: "laliga",
        price: 64.99,
        image: "/assets/productos/La Liga/AtleticoKids2526F/1.webp",
        new: true,
        sale: false,
        kids: true
    },
    {
        id: 111,
        name: "FC Barcelona 25/26 Visitante",
        category: "futbol",
        league: "laliga",
        price: 84.99,
        image: "/assets/productos/La Liga/Barcelona2526F/1.webp",
        new: true,
        sale: false
    },
    {
        id: 112,
        name: "FC Barcelona 25/26 Local",
        category: "futbol",
        league: "laliga",
        price: 84.99,
        image: "/assets/productos/La Liga/Barcelona2526L/1.webp",
        new: true,
        sale: false
    },
    {
        id: 113,
        name: "FC Barcelona 25/26 Tercera",
        category: "futbol",
        league: "laliga",
        price: 84.99,
        image: "/assets/productos/La Liga/Barcelona2526T/1.webp",
        new: true,
        sale: false
    },
    {
        id: 114,
        name: "FC Barcelona 96/97 Local Retro",
        category: "futbol",
        league: "retro",
        price: 94.99,
        image: "/assets/productos/La Liga/Barcelona9697LR/1.webp",
        new: false,
        sale: false,
        retro: true
    },
    {
        id: 115,
        name: "Real Betis 25/26 Local",
        category: "futbol",
        league: "laliga",
        price: 79.99,
        image: "/assets/productos/La Liga/Betis2526L/1.webp",
        new: true,
        sale: false
    },
    {
        id: 116,
        name: "Celta de Vigo 25/26 Local",
        category: "futbol",
        league: "laliga",
        price: 79.99,
        image: "/assets/productos/La Liga/Celta2526L/1.webp",
        new: true,
        sale: false
    },
    {
        id: 117,
        name: "Elche 25/26 Visitante",
        category: "futbol",
        league: "laliga",
        price: 74.99,
        image: "/assets/productos/La Liga/Elche2526F/1.webp",
        new: true,
        sale: false
    },
    {
        id: 118,
        name: "Elche 25/26 Local",
        category: "futbol",
        league: "laliga",
        price: 74.99,
        image: "/assets/productos/La Liga/Elche2526L/1.webp",
        new: true,
        sale: false
    },
    {
        id: 119,
        name: "Espanyol 99/00 Local Retro",
        category: "futbol",
        league: "retro",
        price: 89.99,
        image: "/assets/productos/La Liga/Espanyol9920LR/1.webp",
        new: false,
        sale: false,
        retro: true
    },
    {
        id: 120,
        name: "Getafe 25/26 Local",
        category: "futbol",
        league: "laliga",
        price: 79.99,
        image: "/assets/productos/La Liga/Getafe2526L/1.webp",
        new: true,
        sale: false
    },
    {
        id: 121,
        name: "Girona 25/26 Local",
        category: "futbol",
        league: "laliga",
        price: 79.99,
        image: "/assets/productos/La Liga/Girona2526L/1.webp",
        new: true,
        sale: false
    },
    {
        id: 122,
        name: "Granada 25/26 Local",
        category: "futbol",
        league: "laliga",
        price: 74.99,
        image: "/assets/productos/La Liga/Granada2526L/1.webp",
        new: true,
        sale: false
    },
    {
        id: 123,
        name: "Las Palmas 25/26 Visitante",
        category: "futbol",
        league: "laliga",
        price: 79.99,
        image: "/assets/productos/La Liga/LasPalmas2526F/1.webp",
        new: true,
        sale: false
    },
    {
        id: 124,
        name: "Las Palmas 25/26 Local",
        category: "futbol",
        league: "laliga",
        price: 79.99,
        image: "/assets/productos/La Liga/LasPalmas2526L/1.webp",
        new: true,
        sale: false
    },
    {
        id: 125,
        name: "Leganés 25/26 Local",
        category: "futbol",
        league: "laliga",
        price: 74.99,
        image: "/assets/productos/La Liga/Leganes2526L/1.webp",
        new: true,
        sale: false
    },
    {
        id: 126,
        name: "Levante 25/26 Local",
        category: "futbol",
        league: "laliga",
        price: 74.99,
        image: "/assets/productos/La Liga/Levante2526L/1.webp",
        new: true,
        sale: false
    },
    {
        id: 127,
        name: "Málaga 25/26 Local",
        category: "futbol",
        league: "laliga",
        price: 74.99,
        image: "/assets/productos/La Liga/Malaga2526L/1.webp",
        new: true,
        sale: false
    },
    {
        id: 128,
        name: "Málaga 25/26 Local (Kids)",
        category: "futbol",
        league: "laliga",
        price: 59.99,
        image: "/assets/productos/La Liga/MalagaKids2526L/1.webp",
        new: true,
        sale: false,
        kids: true
    },
    {
        id: 129,
        name: "Mallorca 25/26 Local",
        category: "futbol",
        league: "laliga",
        price: 79.99,
        image: "/assets/productos/La Liga/Mallorca2526L/1.webp",
        new: true,
        sale: false
    },
    {
        id: 130,
        name: "Osasuna 25/26 Local",
        category: "futbol",
        league: "laliga",
        price: 79.99,
        image: "/assets/productos/La Liga/Osasuna2526L/1.webp",
        new: true,
        sale: false
    },
    {
        id: 131,
        name: "Real Oviedo 25/26 Local",
        category: "futbol",
        league: "laliga",
        price: 74.99,
        image: "/assets/productos/La Liga/Oviedo2526L/1.webp",
        new: true,
        sale: false
    },
    {
        id: 132,
        name: "Rayo Vallecano 25/26 Local",
        category: "futbol",
        league: "laliga",
        price: 79.99,
        image: "/assets/productos/La Liga/Rayo2526L/1.webp",
        new: true,
        sale: false
    },
    {
        id: 133,
        name: "Real Madrid 25/26 Visitante",
        category: "futbol",
        league: "laliga",
        price: 89.99,
        image: "/assets/productos/La Liga/RealMadrid2526F/1.webp",
        new: true,
        sale: false
    },
    {
        id: 134,
        name: "Real Madrid 25/26 Local",
        category: "futbol",
        league: "laliga",
        price: 89.99,
        image: "/assets/productos/La Liga/RealMadrid2526L/1.webp",
        new: true,
        sale: false
    },
    {
        id: 135,
        name: "Real Madrid 25/26 Tercera",
        category: "futbol",
        league: "laliga",
        price: 89.99,
        image: "/assets/productos/La Liga/RealMadrid2526T/1.webp",
        new: true,
        sale: false
    },
    {
        id: 136,
        name: "Real Sociedad 25/26 Local",
        category: "futbol",
        league: "laliga",
        price: 79.99,
        image: "/assets/productos/La Liga/RealSociedad2526L/1.webp",
        new: true,
        sale: false
    },
    {
        id: 137,
        name: "Sevilla 25/26 Visitante",
        category: "futbol",
        league: "laliga",
        price: 79.99,
        image: "/assets/productos/La Liga/Sevilla2526F/1.webp",
        new: true,
        sale: false
    },
    {
        id: 138,
        name: "Sevilla 25/26 Local",
        category: "futbol",
        league: "laliga",
        price: 79.99,
        image: "/assets/productos/La Liga/Sevilla2526L/1.webp",
        new: true,
        sale: false
    },
    {
        id: 139,
        name: "Sevilla 25/26 Tercera",
        category: "futbol",
        league: "laliga",
        price: 79.99,
        image: "/assets/productos/La Liga/Sevilla2526T/1.webp",
        new: true,
        sale: false
    },
    {
        id: 140,
        name: "Valencia 25/26 Local",
        category: "futbol",
        league: "laliga",
        price: 79.99,
        image: "/assets/productos/La Liga/Valencia2526L/1.webp",
        new: true,
        sale: false
    },
    {
        id: 141,
        name: "Valladolid 25/26 Local",
        category: "futbol",
        league: "laliga",
        price: 79.99,
        image: "/assets/productos/La Liga/Valladolid2526L/1.webp",
        new: true,
        sale: false
    },
    {
        id: 142,
        name: "Villarreal 25/26 Local",
        category: "futbol",
        league: "laliga",
        price: 79.99,
        image: "/assets/productos/La Liga/Villarreal2526L/1.webp",
        new: true,
        sale: false
    },
    {
        id: 201,
        name: "Arsenal 25/26 Local",
        category: "futbol",
        league: "premier",
        price: 84.99,
        image: "/assets/productos/Premier League/Arsenal2525L/1.webp",
        new: true,
        sale: false
    },
    {
        id: 202,
        name: "Arsenal 25/26 Visitante",
        category: "futbol",
        league: "premier",
        price: 84.99,
        image: "/assets/productos/Premier League/Arsenal2526F/1.webp",
        new: true,
        sale: false
    },
    {
        id: 203,
        name: "Aston Villa 25/26 Local",
        category: "futbol",
        league: "premier",
        price: 79.99,
        image: "/assets/productos/Premier League/AstonVilla2526L/1.webp",
        new: true,
        sale: false
    },
    {
        id: 204,
        name: "Chelsea 25/26 Local",
        category: "futbol",
        league: "premier",
        price: 84.99,
        image: "/assets/productos/Premier League/Chealsea2526L/1.webp",
        new: true,
        sale: false
    },
    {
        id: 205,
        name: "Crystal Palace 25/26 Local",
        category: "futbol",
        league: "premier",
        price: 79.99,
        image: "/assets/productos/Premier League/CrystalPalace2526L/1.webp",
        new: true,
        sale: false
    },
    {
        id: 206,
        name: "Man City 25/26 Visitante",
        category: "futbol",
        league: "premier",
        price: 89.99,
        image: "/assets/productos/Premier League/ManCity2526F/1.webp",
        new: true,
        sale: false
    },
    {
        id: 207,
        name: "Man United 25/26 Local",
        category: "futbol",
        league: "premier",
        price: 89.99,
        image: "/assets/productos/Premier League/ManUnited2526L/1.webp",
        new: true,
        sale: false
    },
    {
        id: 208,
        name: "Newcastle 25/26 Local",
        category: "futbol",
        league: "premier",
        price: 84.99,
        image: "/assets/productos/Premier League/Newcastle2526L/1.webp",
        new: true,
        sale: false
    },
    {
        id: 209,
        name: "Man United 25/26 Visitante (Kids)",
        category: "futbol",
        league: "premier",
        price: 64.99,
        image: "/assets/productos/Premier League/UnitedKids2526F/1.webp",
        new: true,
        sale: false,
        kids: true
    },
    {
        id: 301,
        name: "Lazio 25/26 Visitante",
        category: "futbol",
        league: "seriea",
        price: 79.99,
        image: "/assets/productos/Serie A/Lazio2526F/1.webp",
        new: true,
        sale: false
    },
    {
        id: 302,
        name: "AC Milan 97/98 Local Retro",
        category: "futbol",
        league: "retro",
        price: 94.99,
        image: "/assets/productos/Serie A/Milan9798LR/1.webp",
        new: false,
        sale: false,
        retro: true
    },
    {
        id: 303,
        name: "Napoli 25/26 Local",
        category: "futbol",
        league: "seriea",
        price: 84.99,
        image: "/assets/productos/Serie A/Napoli2526L/1.webp",
        new: true,
        sale: false
    },
    {
        id: 304,
        name: "AS Roma 25/26 Local (Kids)",
        category: "futbol",
        league: "seriea",
        price: 64.99,
        image: "/assets/productos/Serie A/RomaKids2526L/1.webp",
        new: true,
        sale: false,
        kids: true
    },
    {
        id: 401,
        name: "Bayern Munich 25/26 Local",
        category: "futbol",
        league: "bundesliga",
        price: 89.99,
        image: "/assets/productos/Bundesliga/Munich2526L/1.webp",
        new: true,
        sale: false
    },
    {
        id: 402,
        name: "Schalke 04 25/26 Local",
        category: "futbol",
        league: "bundesliga",
        price: 79.99,
        image: "/assets/productos/Bundesliga/Schalke2526L/1.webp",
        new: true,
        sale: false
    },
    {
        id: 501,
        name: "Marseille 25/26 Visitante (Kids)",
        category: "futbol",
        league: "ligue1",
        price: 64.99,
        image: "/assets/productos/Ligue 1/MarseillaKids2526F/1.webp",
        new: true,
        sale: false,
        kids: true
    },
    {
        id: 502,
        name: "Monaco 25/26 Visitante",
        category: "futbol",
        league: "ligue1",
        price: 79.99,
        image: "/assets/productos/Ligue 1/Monaco2526F/1.webp",
        new: true,
        sale: false
    },
    {
        id: 503,
        name: "PSG 25/26 Local",
        category: "futbol",
        league: "ligue1",
        price: 89.99,
        image: "/assets/productos/Ligue 1/Paris2526L/1.webp",
        new: true,
        sale: false
    },
    {
        id: 504,
        name: "PSG 25/26 Tercera",
        category: "futbol",
        league: "ligue1",
        price: 89.99,
        image: "/assets/productos/Ligue 1/PSG2526T/1.webp",
        new: true,
        sale: false
    },
    {
        id: 601,
        name: "España 08/09 Local Retro",
        category: "futbol",
        league: "retro",
        price: 99.99,
        image: "/assets/productos/Internacional/España0809LR/1.webp",
        new: false,
        sale: false,
        retro: true
    },
    {
        id: 602,
        name: "España 24/25 Local",
        category: "futbol",
        league: "selecciones",
        price: 89.99,
        image: "/assets/productos/Internacional/España2425L/1.webp",
        new: true,
        sale: false
    },
    {
        id: 603,
        name: "Francia 98/99 Local Retro",
        category: "futbol",
        league: "retro",
        price: 99.99,
        image: "/assets/productos/Internacional/Francia9899LR/1.webp",
        new: false,
        sale: false,
        retro: true
    },
    {
        id: 604,
        name: "Holanda 98/99 Local Retro",
        category: "futbol",
        league: "retro",
        price: 99.99,
        image: "/assets/productos/Internacional/Holanda9899LR/1.webp",
        new: false,
        sale: false,
        retro: true
    },
    {
        id: 551,
        name: "Flamengo 25/26 Tercera",
        category: "futbol",
        league: "brasileirao",
        price: 74.99,
        image: "/assets/productos/Brasileirão Série A/Flamengo2526T/1.webp",
        new: true,
        sale: false
    },
    {
        id: 561,
        name: "Al-Nassr 25/26 Local",
        category: "futbol",
        league: "ligaarabe",
        price: 79.99,
        image: "/assets/productos/Liga Arabe/Al-Nassr2526L/1.webp",
        new: true,
        sale: false
    },
    {
        id: 571,
        name: "Boca Juniors 01/02 Local Retro",
        category: "futbol",
        league: "retro",
        price: 89.99,
        image: "/assets/productos/SAF (Argentina)/Boca0102LR/1.webp",
        new: false,
        sale: false,
        retro: true
    },
    {
        id: 572,
        name: "River Plate 25/26 Local",
        category: "futbol",
        league: "saf",
        price: 74.99,
        image: "/assets/productos/SAF (Argentina)/River2526L/1.webp",
        new: true,
        sale: false
    },
    {
        id: 573,
        name: "River Plate 25/26 Local (Kids)",
        category: "futbol",
        league: "saf",
        price: 59.99,
        image: "/assets/productos/SAF (Argentina)/RiverKids2526L/1.webp",
        new: true,
        sale: false,
        kids: true
    },
    {
        id: 701,
        name: "Lakers LeBron James Icon",
        category: "nba",
        league: "nba",
        price: 95.00,
        image: "/assets/productos/NBA/Lakers1/1.webp",
        new: false,
        sale: true,
        oldPrice: 110.00
    },
    {
        id: 702,
        name: "Oklahoma City Thunder",
        category: "nba",
        league: "nba",
        price: 95.00,
        image: "/assets/productos/NBA/Oklahoma/1.webp",
        new: true,
        sale: false
    },
    {
        id: 703,
        name: "Philadelphia 76ers",
        category: "nba",
        league: "nba",
        price: 95.00,
        image: "/assets/productos/NBA/Phila1/1.webp",
        new: false,
        sale: false
    }
];

export default products;

