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
        name: "Athletic Club 25/26 Tercera",
        category: "futbol",
        league: "laliga",
        price: 64.99,
        image: "/assets/productos/La Liga/AthelticKids2526T/1.webp",
        new: true,
        sale: false,
        kids: true,
        slug: "athletic-club-2526-tercera"
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
        name: "Atlético Madrid 25/26 Visitante",
        category: "futbol",
        league: "laliga",
        price: 64.99,
        image: "/assets/productos/La Liga/AtleticoKids2526F/1.webp",
        new: true,
        sale: false,
        kids: true,
        slug: "atltico-madrid-2526-visitante"
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
        name: "Málaga 25/26 Local",
        category: "futbol",
        league: "laliga",
        price: 59.99,
        image: "/assets/productos/La Liga/MalagaKids2526L/1.webp",
        new: true,
        sale: false,
        kids: true,
        slug: "mlaga-2526-local"
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
        name: "Man United 25/26 Visitante",
        category: "futbol",
        league: "premier",
        price: 64.99,
        image: "/assets/productos/Premier League/UnitedKids2526F/1.webp",
        new: true,
        sale: false,
        kids: true,
        slug: "man-united-2526-visitante"
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
        name: "AS Roma 25/26 Local",
        category: "futbol",
        league: "seriea",
        price: 64.99,
        image: "/assets/productos/Serie A/RomaKids2526L/1.webp",
        new: true,
        sale: false,
        kids: true,
        slug: "as-roma-2526-local"
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
        name: "Marseille 25/26 Visitante",
        category: "futbol",
        league: "ligue1",
        price: 64.99,
        image: "/assets/productos/Ligue 1/MarseillaKids2526F/1.webp",
        new: true,
        sale: false,
        kids: true,
        slug: "marseille-2526-visitante"
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
        name: "River Plate 25/26 Local",
        category: "futbol",
        league: "saf",
        price: 59.99,
        image: "/assets/productos/SAF (Argentina)/RiverKids2526L/1.webp",
        new: true,
        sale: false,
        kids: true,
        slug: "river-plate-2526-local"
    },
    {
        id: 701,
        name: "Lakers LeBron James Icon",
        category: "nba",
        league: "nba",
        price: 95,
        image: "/assets/productos/NBA/Lakers1/1.webp",
        new: false,
        sale: true,
        oldPrice: 110
    },
    {
        id: 702,
        name: "Oklahoma City Thunder",
        category: "nba",
        league: "nba",
        price: 95,
        image: "/assets/productos/NBA/Oklahoma/1.webp",
        new: true,
        sale: false
    },
    {
        id: 703,
        name: "Philadelphia 76ers",
        category: "nba",
        league: "nba",
        price: 95,
        image: "/assets/productos/NBA/Phila1/1.webp",
        new: false,
        sale: false
    },
    {
        id: 937715,
        name: "Japón 2026 Local",
        slug: "japn-2026-local",
        category: "futbol",
        league: "selecciones",
        price: 0,
        image: "/assets/productos/Yupoo/219491642/1.jpg",
        images: [
            "/assets/productos/Yupoo/219491642/2.jpg"
        ],
        imageAlt: "Japón 2026 Local - Vista principal",
        new: true,
        sale: false,
        source: {
            provider: "yupoo",
            url: "https://pandasportjersey.x.yupoo.com/albums/219491642?uid=1",
            albumId: "219491642"
        },
        tipo: "local",
        tallas: "S-4XL",
        temporada: "2026"
    },
    {
        id: 978161,
        name: "Palmeiras 25/26 Visitante",
        slug: "palmeiras-2526-visitante",
        category: "futbol",
        league: "brasileirao",
        price: 0,
        image: "/assets/productos/Yupoo/210081096/1.jpg",
        images: [
            "/assets/productos/Yupoo/210081096/2.jpg"
        ],
        imageAlt: "Palmeiras 25/26 Visitante - Vista principal",
        new: true,
        sale: false,
        source: {
            provider: "yupoo",
            url: "https://minkang.x.yupoo.com/albums/210081096?uid=1",
            albumId: "210081096"
        },
        temporada: "25/26",
        tipo: "visitante",
        tallas: "S-4XL"
    },
    {
        id: 362332,
        name: "Alaves 25/26 Local",
        slug: "alaves-2526-local",
        category: "futbol",
        league: "laliga",
        price: 0,
        image: "/assets/productos/Yupoo/216419940/1.jpg",
        images: [
            "/assets/productos/Yupoo/216419940/2.jpg"
        ],
        imageAlt: "Alaves 25/26 Local - Vista principal",
        new: true,
        sale: false,
        source: {
            provider: "yupoo",
            url: "https://pandasportjersey.x.yupoo.com/albums/216419940?uid=1&isSubCate=false&referrercate=2962411",
            albumId: "216419940"
        },
        temporada: "25/26",
        tipo: "local",
        tallas: "S-4XL"
    },
    {
        id: 948475,
        name: "Real Murcia 25/26 Local",
        slug: "real-murcia-2526-local",
        category: "futbol",
        league: "laliga",
        price: 0,
        image: "/assets/productos/Yupoo/216806487/1.jpg",
        images: [
            "/assets/productos/Yupoo/216806487/2.jpg"
        ],
        imageAlt: "Real Murcia 25/26 Local - Vista principal",
        new: true,
        sale: false,
        source: {
            provider: "yupoo",
            url: "https://pandasportjersey.x.yupoo.com/albums/216806487?uid=1&isSubCate=false&referrercate=2962411",
            albumId: "216806487"
        },
        temporada: "25/26",
        tipo: "local",
        tallas: "S-4XL"
    },
    {
        id: 892563,
        name: "Osasuna 25/26 Visitante",
        slug: "osasuna-2526-visitante",
        category: "futbol",
        league: "laliga",
        price: 0,
        image: "/assets/productos/Yupoo/211234491/1.jpg",
        images: [
            "/assets/productos/Yupoo/211234491/2.jpg",
            "/assets/productos/Yupoo/211234491/3.jpg",
            "/assets/productos/Yupoo/211234491/4.jpg",
            "/assets/productos/Yupoo/211234491/5.jpg",
            "/assets/productos/Yupoo/211234491/6.jpg",
            "/assets/productos/Yupoo/211234491/7.jpg",
            "/assets/productos/Yupoo/211234491/8.jpg"
        ],
        imageAlt: "Osasuna 25/26 Visitante - Vista principal",
        new: true,
        sale: false,
        source: {
            provider: "yupoo",
            url: "https://pandasportjersey.x.yupoo.com/albums/211234491?uid=1&isSubCate=false&referrercate=2962411",
            albumId: "211234491"
        },
        temporada: "25/26",
        tipo: "visitante",
        tallas: "S-4XL"
    },
    {
        id: 388938,
        name: "Real Betis 25/26 Visitante",
        slug: "real-betis-2526-visitante",
        category: "futbol",
        league: "laliga",
        price: 0,
        image: "/assets/productos/Yupoo/211234641/1.jpg",
        images: [
            "/assets/productos/Yupoo/211234641/2.jpg",
            "/assets/productos/Yupoo/211234641/3.jpg",
            "/assets/productos/Yupoo/211234641/4.jpg",
            "/assets/productos/Yupoo/211234641/5.jpg",
            "/assets/productos/Yupoo/211234641/6.jpg",
            "/assets/productos/Yupoo/211234641/7.jpg",
            "/assets/productos/Yupoo/211234641/8.jpg"
        ],
        imageAlt: "Real Betis 25/26 Visitante - Vista principal",
        new: true,
        sale: false,
        source: {
            provider: "yupoo",
            url: "https://pandasportjersey.x.yupoo.com/albums/211234641?uid=1&isSubCate=false&referrercate=2962411",
            albumId: "211234641"
        },
        temporada: "25/26",
        tipo: "visitante",
        tallas: "S-4XL"
    },
    {
        id: 105061,
        name: "Valladolid 25/26 Visitante",
        slug: "valladolid-2526-visitante",
        category: "futbol",
        league: "laliga",
        price: 0,
        image: "/assets/productos/Yupoo/207563358/1.jpg",
        images: [
            "/assets/productos/Yupoo/207563358/2.jpg",
            "/assets/productos/Yupoo/207563358/3.jpg",
            "/assets/productos/Yupoo/207563358/4.jpg",
            "/assets/productos/Yupoo/207563358/5.jpg",
            "/assets/productos/Yupoo/207563358/6.jpg",
            "/assets/productos/Yupoo/207563358/7.jpg",
            "/assets/productos/Yupoo/207563358/8.jpg"
        ],
        imageAlt: "Valladolid 25/26 Visitante - Vista principal",
        new: true,
        sale: false,
        source: {
            provider: "yupoo",
            url: "https://pandasportjersey.x.yupoo.com/albums/207563358?uid=1&isSubCate=false&referrercate=2962411",
            albumId: "207563358"
        },
        temporada: "25/26",
        tipo: "visitante",
        tallas: "S-4XL"
    },
    {
        id: 945475,
        name: "Real Betis 25/26 Tercera",
        slug: "real-betis-2526-tercera",
        category: "futbol",
        league: "laliga",
        price: 0,
        image: "/assets/productos/Yupoo/207560329/1.jpg",
        images: [
            "/assets/productos/Yupoo/207560329/2.jpg",
            "/assets/productos/Yupoo/207560329/3.jpg",
            "/assets/productos/Yupoo/207560329/4.jpg",
            "/assets/productos/Yupoo/207560329/5.jpg",
            "/assets/productos/Yupoo/207560329/6.jpg",
            "/assets/productos/Yupoo/207560329/7.jpg",
            "/assets/productos/Yupoo/207560329/8.jpg",
            "/assets/productos/Yupoo/207560329/9.jpg",
            "/assets/productos/Yupoo/207560329/10.jpg",
            "/assets/productos/Yupoo/207560329/11.jpg"
        ],
        imageAlt: "Real Betis 25/26 Tercera - Vista principal",
        new: true,
        sale: false,
        source: {
            provider: "yupoo",
            url: "https://pandasportjersey.x.yupoo.com/albums/207560329?uid=1&isSubCate=false&referrercate=2962411",
            albumId: "207560329"
        },
        temporada: "25/26",
        tipo: "tercera",
        tallas: "S-4XL"
    },
    {
        id: 520253,
        name: "Deportivo La Coruna 25/26 Local",
        slug: "deportivo-la-coruna-2526-local",
        category: "futbol",
        league: "laliga",
        price: 0,
        image: "/assets/productos/Yupoo/207558615/1.jpg",
        images: [
            "/assets/productos/Yupoo/207558615/2.jpg",
            "/assets/productos/Yupoo/207558615/3.jpg",
            "/assets/productos/Yupoo/207558615/4.jpg",
            "/assets/productos/Yupoo/207558615/5.jpg",
            "/assets/productos/Yupoo/207558615/6.jpg",
            "/assets/productos/Yupoo/207558615/7.jpg",
            "/assets/productos/Yupoo/207558615/8.jpg",
            "/assets/productos/Yupoo/207558615/9.jpg"
        ],
        imageAlt: "Deportivo La Coruna 25/26 Local - Vista principal",
        new: true,
        sale: false,
        source: {
            provider: "yupoo",
            url: "https://pandasportjersey.x.yupoo.com/albums/207558615?uid=1&isSubCate=false&referrercate=2962411",
            albumId: "207558615"
        },
        temporada: "25/26",
        tipo: "local",
        tallas: "S-4XL"
    },
    {
        id: 811678,
        name: "Deportivo La Coruna 25/26 Tercera",
        slug: "deportivo-la-coruna-2526-tercera",
        category: "futbol",
        league: "laliga",
        price: 0,
        image: "/assets/productos/Yupoo/207558748/1.jpg",
        images: [
            "/assets/productos/Yupoo/207558748/2.jpg",
            "/assets/productos/Yupoo/207558748/3.jpg",
            "/assets/productos/Yupoo/207558748/4.jpg",
            "/assets/productos/Yupoo/207558748/5.jpg",
            "/assets/productos/Yupoo/207558748/6.jpg",
            "/assets/productos/Yupoo/207558748/7.jpg",
            "/assets/productos/Yupoo/207558748/8.jpg"
        ],
        imageAlt: "Deportivo La Coruna 25/26 Tercera - Vista principal",
        new: true,
        sale: false,
        source: {
            provider: "yupoo",
            url: "https://pandasportjersey.x.yupoo.com/albums/207558748?uid=1&isSubCate=false&referrercate=2962411",
            albumId: "207558748"
        },
        temporada: "25/26",
        tipo: "tercera",
        tallas: "S-4XL"
    },
    {
        id: 199666,
        name: "Celta 25/26 Tercera",
        slug: "celta-2526-tercera",
        category: "futbol",
        league: "laliga",
        price: 0,
        image: "/assets/productos/Yupoo/207557734/1.jpg",
        images: [
            "/assets/productos/Yupoo/207557734/2.jpg",
            "/assets/productos/Yupoo/207557734/3.jpg",
            "/assets/productos/Yupoo/207557734/4.jpg",
            "/assets/productos/Yupoo/207557734/5.jpg",
            "/assets/productos/Yupoo/207557734/6.jpg",
            "/assets/productos/Yupoo/207557734/7.jpg",
            "/assets/productos/Yupoo/207557734/8.jpg",
            "/assets/productos/Yupoo/207557734/9.jpg"
        ],
        imageAlt: "Celta 25/26 Tercera - Vista principal",
        new: true,
        sale: false,
        source: {
            provider: "yupoo",
            url: "https://pandasportjersey.x.yupoo.com/albums/207557734?uid=1&isSubCate=false&referrercate=2962411",
            albumId: "207557734"
        },
        temporada: "25/26",
        tipo: "tercera",
        tallas: "S-4XL"
    },
    {
        id: 987640,
        name: "Celta 25/26 Visitante",
        slug: "celta-2526-visitante",
        category: "futbol",
        league: "laliga",
        price: 0,
        image: "/assets/productos/Yupoo/203698925/1.jpg",
        images: [
            "/assets/productos/Yupoo/203698925/2.jpg",
            "/assets/productos/Yupoo/203698925/3.jpg",
            "/assets/productos/Yupoo/203698925/4.jpg",
            "/assets/productos/Yupoo/203698925/5.jpg",
            "/assets/productos/Yupoo/203698925/6.jpg",
            "/assets/productos/Yupoo/203698925/7.jpg",
            "/assets/productos/Yupoo/203698925/8.jpg",
            "/assets/productos/Yupoo/203698925/9.jpg"
        ],
        imageAlt: "Celta 25/26 Visitante - Vista principal",
        new: true,
        sale: false,
        source: {
            provider: "yupoo",
            url: "https://pandasportjersey.x.yupoo.com/albums/203698925?uid=1&isSubCate=false&referrercate=2962411",
            albumId: "203698925"
        },
        temporada: "25/26",
        tipo: "visitante",
        tallas: "S-4XL"
    },
    {
        id: 951872,
        name: "Real Madrid Local Retro",
        slug: "real-madrid-local-retro",
        category: "futbol",
        league: "retro",
        price: 0,
        image: "/assets/productos/Yupoo/201351646/1.jpg",
        images: [
            "/assets/productos/Yupoo/201351646/2.jpg",
            "/assets/productos/Yupoo/201351646/3.jpg",
            "/assets/productos/Yupoo/201351646/4.jpg",
            "/assets/productos/Yupoo/201351646/5.jpg",
            "/assets/productos/Yupoo/201351646/6.jpg",
            "/assets/productos/Yupoo/201351646/7.jpg",
            "/assets/productos/Yupoo/201351646/8.jpg"
        ],
        imageAlt: "Real Madrid Local Retro - Vista principal",
        new: true,
        sale: false,
        source: {
            provider: "yupoo",
            url: "https://pandasportjersey.x.yupoo.com/albums/201351646?uid=1&isSubCate=false&referrercate=2962411",
            albumId: "201351646"
        },
        tipo: "local",
        tallas: "S-XXL",
        retro: true
    },
    {
        id: 385774,
        name: "Girona 25/26 Visitante",
        slug: "girona-2526-visitante",
        category: "futbol",
        league: "laliga",
        price: 0,
        image: "/assets/productos/Yupoo/201350059/1.jpg",
        images: [
            "/assets/productos/Yupoo/201350059/2.jpg",
            "/assets/productos/Yupoo/201350059/3.jpg",
            "/assets/productos/Yupoo/201350059/4.jpg",
            "/assets/productos/Yupoo/201350059/5.jpg",
            "/assets/productos/Yupoo/201350059/6.jpg",
            "/assets/productos/Yupoo/201350059/7.jpg",
            "/assets/productos/Yupoo/201350059/8.jpg",
            "/assets/productos/Yupoo/201350059/9.jpg",
            "/assets/productos/Yupoo/201350059/10.jpg"
        ],
        imageAlt: "Girona 25/26 Visitante - Vista principal",
        new: true,
        sale: false,
        source: {
            provider: "yupoo",
            url: "https://pandasportjersey.x.yupoo.com/albums/201350059?uid=1&isSubCate=false&referrercate=2962411",
            albumId: "201350059"
        },
        temporada: "25/26",
        tipo: "visitante",
        tallas: "S-XXL"
    },
    {
        id: 126754,
        name: "Cadiz 25/26 Local",
        slug: "cadiz-2526-local",
        category: "futbol",
        league: "laliga",
        price: 0,
        image: "/assets/productos/Yupoo/200370927/1.jpg",
        images: [
            "/assets/productos/Yupoo/200370927/2.jpg",
            "/assets/productos/Yupoo/200370927/3.jpg",
            "/assets/productos/Yupoo/200370927/4.jpg",
            "/assets/productos/Yupoo/200370927/5.jpg",
            "/assets/productos/Yupoo/200370927/6.jpg",
            "/assets/productos/Yupoo/200370927/7.jpg",
            "/assets/productos/Yupoo/200370927/8.jpg"
        ],
        imageAlt: "Cadiz 25/26 Local - Vista principal",
        new: true,
        sale: false,
        source: {
            provider: "yupoo",
            url: "https://pandasportjersey.x.yupoo.com/albums/200370927?uid=1&isSubCate=false&referrercate=2962411",
            albumId: "200370927"
        },
        temporada: "25/26",
        tipo: "local",
        tallas: "S-4XL"
    },
    {
        id: 489081,
        name: "Zaragoza Local Retro",
        slug: "zaragoza-local-retro",
        category: "futbol",
        league: "retro",
        price: 0,
        image: "/assets/productos/Yupoo/199217731/1.jpg",
        images: [
            "/assets/productos/Yupoo/199217731/2.jpg",
            "/assets/productos/Yupoo/199217731/3.jpg",
            "/assets/productos/Yupoo/199217731/4.jpg",
            "/assets/productos/Yupoo/199217731/5.jpg",
            "/assets/productos/Yupoo/199217731/6.jpg",
            "/assets/productos/Yupoo/199217731/7.jpg",
            "/assets/productos/Yupoo/199217731/8.jpg"
        ],
        imageAlt: "Zaragoza Local Retro - Vista principal",
        new: true,
        sale: false,
        source: {
            provider: "yupoo",
            url: "https://pandasportjersey.x.yupoo.com/albums/199217731?uid=1&isSubCate=false&referrercate=2962411",
            albumId: "199217731"
        },
        tipo: "local",
        tallas: "S-XXL",
        retro: true
    },
    {
        id: 891737,
        name: "Real Madrid 25/26 Black",
        slug: "real-madrid-2526-black",
        category: "futbol",
        league: "laliga",
        price: 0,
        image: "/assets/productos/Yupoo/197579658/1.jpg",
        images: [
            "/assets/productos/Yupoo/197579658/2.jpg",
            "/assets/productos/Yupoo/197579658/3.jpg",
            "/assets/productos/Yupoo/197579658/4.jpg",
            "/assets/productos/Yupoo/197579658/5.jpg",
            "/assets/productos/Yupoo/197579658/6.jpg",
            "/assets/productos/Yupoo/197579658/7.jpg",
            "/assets/productos/Yupoo/197579658/8.jpg"
        ],
        imageAlt: "Real Madrid 25/26 Black - Vista principal",
        new: true,
        sale: false,
        source: {
            provider: "yupoo",
            url: "https://pandasportjersey.x.yupoo.com/albums/197579658?uid=1&isSubCate=false&referrercate=2962411",
            albumId: "197579658"
        },
        temporada: "25/26",
        tallas: "S-XXL"
    },
    {
        id: 737878,
        name: "Zaragoza 97/98 Local Retro",
        slug: "zaragoza-9798-local-retro",
        category: "futbol",
        league: "retro",
        price: 0,
        image: "/assets/productos/Yupoo/197575643/1.jpg",
        images: [
            "/assets/productos/Yupoo/197575643/2.jpg",
            "/assets/productos/Yupoo/197575643/3.jpg",
            "/assets/productos/Yupoo/197575643/4.jpg",
            "/assets/productos/Yupoo/197575643/5.jpg",
            "/assets/productos/Yupoo/197575643/6.jpg",
            "/assets/productos/Yupoo/197575643/7.jpg",
            "/assets/productos/Yupoo/197575643/8.jpg"
        ],
        imageAlt: "Zaragoza 97/98 Local Retro - Vista principal",
        new: true,
        sale: false,
        source: {
            provider: "yupoo",
            url: "https://pandasportjersey.x.yupoo.com/albums/197575643?uid=1&isSubCate=false&referrercate=2962411",
            albumId: "197575643"
        },
        temporada: "97/98",
        tipo: "local",
        tallas: "S-XXL",
        retro: true
    },
    {
        id: 745212,
        name: "Getafe 09/10 Local Retro",
        slug: "getafe-0910-local-retro",
        category: "futbol",
        league: "retro",
        price: 0,
        image: "/assets/productos/Yupoo/192258362/1.jpg",
        images: [
            "/assets/productos/Yupoo/192258362/2.jpg",
            "/assets/productos/Yupoo/192258362/3.jpg",
            "/assets/productos/Yupoo/192258362/4.jpg",
            "/assets/productos/Yupoo/192258362/5.jpg",
            "/assets/productos/Yupoo/192258362/6.jpg",
            "/assets/productos/Yupoo/192258362/7.jpg",
            "/assets/productos/Yupoo/192258362/8.jpg"
        ],
        imageAlt: "Getafe 09/10 Local Retro - Vista principal",
        new: true,
        sale: false,
        source: {
            provider: "yupoo",
            url: "https://pandasportjersey.x.yupoo.com/albums/192258362?uid=1&isSubCate=false&referrercate=2962411",
            albumId: "192258362"
        },
        temporada: "09/10",
        tipo: "local",
        tallas: "S-XXL",
        retro: true
    },
    {
        id: 144708,
        name: "Málaga CF Stadium Local Retro",
        slug: "malaga-cf-stadium-local-retro",
        category: "futbol",
        league: "retro",
        price: 0,
        image: "/assets/productos/Yupoo/187757557/1.jpg",
        images: [
            "/assets/productos/Yupoo/187757557/2.jpg",
            "/assets/productos/Yupoo/187757557/3.jpg",
            "/assets/productos/Yupoo/187757557/4.jpg",
            "/assets/productos/Yupoo/187757557/5.jpg",
            "/assets/productos/Yupoo/187757557/6.jpg",
            "/assets/productos/Yupoo/187757557/7.jpg",
            "/assets/productos/Yupoo/187757557/8.jpg"
        ],
        imageAlt: "Málaga CF Stadium Local Retro - Vista principal",
        new: true,
        sale: false,
        source: {
            provider: "yupoo",
            url: "https://pandasportjersey.x.yupoo.com/albums/187757557?uid=1&isSubCate=false&referrercate=2962411",
            albumId: "187757557"
        },
        tipo: "local",
        tallas: "S-XXL",
        retro: true
    },
    {
        id: 294032,
        name: "Italia 2026 Local",
        slug: "italia-2026-local",
        category: "futbol",
        league: "selecciones",
        price: 0,
        image: "/assets/productos/Yupoo/219491302/1.jpg",
        images: [
            "/assets/productos/Yupoo/219491302/2.jpg"
        ],
        imageAlt: "Italia 2026 Local - Vista principal",
        new: true,
        sale: false,
        source: {
            provider: "yupoo",
            url: "https://pandasportjersey.x.yupoo.com/albums/219491302?uid=1&isSubCate=false&referrercate=545635",
            albumId: "219491302"
        },
        tipo: "local",
        tallas: "S-4XL",
        temporada: "2026"
    },
    {
        id: 737806,
        name: "Inglaterra 2026 Local",
        slug: "inglaterra-2026-local",
        category: "futbol",
        league: "selecciones",
        price: 0,
        image: "/assets/productos/Yupoo/219490998/1.jpg",
        images: [
            "/assets/productos/Yupoo/219490998/2.jpg"
        ],
        imageAlt: "Inglaterra 2026 Local - Vista principal",
        new: true,
        sale: false,
        source: {
            provider: "yupoo",
            url: "https://pandasportjersey.x.yupoo.com/albums/219490998?uid=1&isSubCate=false&referrercate=545635",
            albumId: "219490998"
        },
        tipo: "local",
        tallas: "S-4XL",
        temporada: "2026"
    },
    {
        id: 120417,
        name: "Alemania 2026 Local",
        slug: "alemania-2026-local",
        category: "futbol",
        league: "selecciones",
        price: 0,
        image: "/assets/productos/Yupoo/219463186/1.jpg",
        images: [
            "/assets/productos/Yupoo/219463186/2.jpg"
        ],
        imageAlt: "Alemania 2026 Local - Vista principal",
        new: true,
        sale: false,
        source: {
            provider: "yupoo",
            url: "https://pandasportjersey.x.yupoo.com/albums/219463186?uid=1&isSubCate=false&referrercate=545635",
            albumId: "219463186"
        },
        tipo: "local",
        tallas: "S-4XL",
        temporada: "2026"
    },
    {
        id: 905466,
        name: "Venezuela 2026 Local",
        slug: "venezuela-local",
        category: "futbol",
        league: "selecciones",
        price: 0,
        image: "/assets/productos/Yupoo/218139532/1.jpg",
        images: [
            "/assets/productos/Yupoo/218139532/2.jpg"
        ],
        imageAlt: "Venezuela Local - Vista principal",
        new: true,
        sale: false,
        source: {
            provider: "yupoo",
            url: "https://pandasportjersey.x.yupoo.com/albums/218139532?uid=1&isSubCate=false&referrercate=545635",
            albumId: "218139532"
        },
        tipo: "local",
        tallas: "S-4XL"
    },
    {
        id: 882796,
        name: "España 2026 Local",
        slug: "espaa-2026-local",
        category: "futbol",
        league: "selecciones",
        price: 0,
        image: "/assets/productos/Yupoo/218139402/1.jpg",
        images: [
            "/assets/productos/Yupoo/218139402/2.jpg"
        ],
        imageAlt: "España 2026 Local - Vista principal",
        new: true,
        sale: false,
        source: {
            provider: "yupoo",
            url: "https://pandasportjersey.x.yupoo.com/albums/218139402?uid=1&isSubCate=false&referrercate=545635",
            albumId: "218139402"
        },
        tipo: "local",
        tallas: "S-4XL",
        temporada: "2026"
    },
    {
        id: 431137,
        name: "Costa Rica 2026 Local",
        slug: "costa-rica-local",
        category: "futbol",
        league: "selecciones",
        price: 0,
        image: "/assets/productos/Yupoo/218138743/1.jpg",
        images: [
            "/assets/productos/Yupoo/218138743/2.jpg"
        ],
        imageAlt: "Costa Rica Local - Vista principal",
        new: true,
        sale: false,
        source: {
            provider: "yupoo",
            url: "https://pandasportjersey.x.yupoo.com/albums/218138743?uid=1&isSubCate=false&referrercate=545635",
            albumId: "218138743"
        },
        tipo: "local",
        tallas: "S-4XL"
    },
    {
        id: 238510,
        name: "Atlético Mineiro 25/26 Tercera",
        slug: "atletico-mineiro-2526-tercera",
        category: "futbol",
        league: "brasileirao",
        price: 0,
        image: "/assets/productos/Yupoo/216807613/1.jpg",
        images: [
            "/assets/productos/Yupoo/216807613/2.jpg"
        ],
        imageAlt: "Atlético Mineiro 25/26 Tercera - Vista principal",
        new: true,
        sale: false,
        source: {
            provider: "yupoo",
            url: "https://pandasportjersey.x.yupoo.com/albums/216807613?uid=1&isSubCate=false&referrercate=545635",
            albumId: "216807613"
        },
        temporada: "25/26",
        tipo: "tercera",
        tallas: "S-4XL"
    },
    {
        id: 671227,
        name: "Al-Hilal 25/26 Local",
        slug: "al-hilal-2526-local",
        category: "futbol",
        league: "ligaarabe",
        price: 0,
        image: "/assets/productos/Yupoo/216806586/1.jpg",
        images: [
            "/assets/productos/Yupoo/216806586/2.jpg"
        ],
        imageAlt: "Al-Hilal 25/26 Local - Vista principal",
        new: true,
        sale: false,
        source: {
            provider: "yupoo",
            url: "https://pandasportjersey.x.yupoo.com/albums/216806586?uid=1&isSubCate=false&referrercate=545635",
            albumId: "216806586"
        },
        temporada: "25/26",
        tipo: "local",
        tallas: "S-4XL"
    },
    {
        id: 729212,
        name: "Al-Hilal 25/26 Local",
        slug: "al-hilal-2526-local",
        category: "futbol",
        league: "ligue1",
        price: 0,
        image: "/assets/productos/Yupoo/216806631/1.jpg",
        images: [
            "/assets/productos/Yupoo/216806631/2.jpg"
        ],
        imageAlt: "Al-Hilal 25/26 Local - Vista principal",
        new: true,
        sale: false,
        source: {
            provider: "yupoo",
            url: "https://pandasportjersey.x.yupoo.com/albums/216806631?uid=1&isSubCate=false&referrercate=545635",
            albumId: "216806631"
        },
        temporada: "25/26",
        tipo: "local",
        tallas: "S-4XL"
    },
    {
        id: 984139,
        name: "Al-Hilal 25/26 Tercera",
        slug: "al-hilal-2526-tercera",
        category: "futbol",
        league: "ligaarabe",
        price: 0,
        image: "/assets/productos/Yupoo/216806537/1.jpg",
        images: [
            "/assets/productos/Yupoo/216806537/2.jpg"
        ],
        imageAlt: "Al-Hilal 25/26 Tercera - Vista principal",
        new: true,
        sale: false,
        source: {
            provider: "yupoo",
            url: "https://pandasportjersey.x.yupoo.com/albums/216806537?uid=1&isSubCate=false&referrercate=545635",
            albumId: "216806537"
        },
        temporada: "25/26",
        tipo: "tercera",
        tallas: "S-4XL"
    },
    {
        id: 144601,
        name: "Flamengo 25/26",
        slug: "flamengo-2526",
        category: "futbol",
        league: "brasileirao",
        price: 0,
        image: "/assets/productos/Yupoo/216806071/1.jpg",
        images: [
            "/assets/productos/Yupoo/216806071/2.jpg"
        ],
        imageAlt: "Flamengo 25/26 - Vista principal",
        new: true,
        sale: false,
        source: {
            provider: "yupoo",
            url: "https://pandasportjersey.x.yupoo.com/albums/216806071?uid=1&isSubCate=false&referrercate=545635",
            albumId: "216806071"
        },
        temporada: "25/26",
        tallas: "S-4XL"
    },
    {
        id: 666279,
        name: "Flamengo black 25/26",
        slug: "flamengo-black-2526",
        category: "futbol",
        league: "brasileirao",
        price: 0,
        image: "/assets/productos/Yupoo/216806004/1.jpg",
        images: [
            "/assets/productos/Yupoo/216806004/2.jpg"
        ],
        imageAlt: "Flamengo black 25/26 - Vista principal",
        new: true,
        sale: false,
        source: {
            provider: "yupoo",
            url: "https://pandasportjersey.x.yupoo.com/albums/216806004?uid=1&isSubCate=false&referrercate=545635",
            albumId: "216806004"
        },
        temporada: "25/26",
        tallas: "S-4XL"
    },
    {
        id: 791626,
        name: "México 2026 Local",
        slug: "mxico-2026-local",
        category: "futbol",
        league: "selecciones",
        price: 0,
        image: "/assets/productos/Yupoo/216441726/1.jpg",
        images: [
            "/assets/productos/Yupoo/216441726/2.jpg"
        ],
        imageAlt: "México 2026 Local - Vista principal",
        new: true,
        sale: false,
        source: {
            provider: "yupoo",
            url: "https://pandasportjersey.x.yupoo.com/albums/216441726?uid=1&isSubCate=false&referrercate=545635",
            albumId: "216441726"
        },
        tipo: "local",
        tallas: "S-4XL",
        temporada: "2026"
    },
    {
        id: 405261,
        name: "Alemania 2026 Visitante",
        slug: "alemania-2026-visitante",
        category: "futbol",
        league: "selecciones",
        price: 0,
        image: "/assets/productos/Yupoo/216441793/1.jpg",
        images: [
            "/assets/productos/Yupoo/216441793/2.jpg"
        ],
        imageAlt: "Alemania 2026 Visitante - Vista principal",
        new: true,
        sale: false,
        source: {
            provider: "yupoo",
            url: "https://pandasportjersey.x.yupoo.com/albums/216441793?uid=1&isSubCate=false&referrercate=545635",
            albumId: "216441793"
        },
        tipo: "visitante",
        tallas: "S-4XL",
        temporada: "2026"
    },
    {
        id: 613571,
        name: "Portugal 2026 Local",
        slug: "portugal-2026-local",
        category: "futbol",
        league: "selecciones",
        price: 0,
        image: "/assets/productos/Yupoo/216441953/1.jpg",
        images: [
            "/assets/productos/Yupoo/216441953/2.jpg"
        ],
        imageAlt: "Portugal 2026 Local - Vista principal",
        new: true,
        sale: false,
        source: {
            provider: "yupoo",
            url: "https://pandasportjersey.x.yupoo.com/albums/216441953?uid=1&isSubCate=false&referrercate=545635",
            albumId: "216441953"
        },
        temporada: "2026",
        tipo: "local",
        tallas: "S-4XL"
    },
    {
        id: 851677,
        name: "Al Ahli 26/27 Visitante",
        slug: "al-ahli-2627-visitante",
        category: "futbol",
        league: "ligaarabe",
        price: 0,
        image: "/assets/productos/Yupoo/216423857/1.jpg",
        images: [
            "/assets/productos/Yupoo/216423857/2.jpg"
        ],
        imageAlt: "Al Ahli 26/27 Visitante - Vista principal",
        new: true,
        sale: false,
        source: {
            provider: "yupoo",
            url: "https://pandasportjersey.x.yupoo.com/albums/216423857?uid=1&isSubCate=false&referrercate=545635",
            albumId: "216423857"
        },
        temporada: "26/27",
        tipo: "visitante",
        tallas: "S-4XL"
    },
    {
        id: 382204,
        name: "Al Ahli 26/27 Local",
        slug: "al-ahli-2627-local",
        category: "futbol",
        league: "ligaarabe",
        price: 0,
        image: "/assets/productos/Yupoo/216423781/1.jpg",
        images: [
            "/assets/productos/Yupoo/216423781/2.jpg"
        ],
        imageAlt: "Al Ahli 26/27 Local - Vista principal",
        new: true,
        sale: false,
        source: {
            provider: "yupoo",
            url: "https://pandasportjersey.x.yupoo.com/albums/216423781?uid=1&isSubCate=false&referrercate=545635",
            albumId: "216423781"
        },
        temporada: "26/27",
        tipo: "local",
        tallas: "S-4XL"
    },
    {
        id: 523301,
        name: "Inter Milan 25/26 Tercera",
        slug: "inter-milan-2526-tercera",
        category: "futbol",
        league: "seriea",
        price: 0,
        image: "/assets/productos/Yupoo/216420875/1.jpg",
        images: [
            "/assets/productos/Yupoo/216420875/2.jpg"
        ],
        imageAlt: "Inter Milan 25/26 Tercera - Vista principal",
        new: true,
        sale: false,
        source: {
            provider: "yupoo",
            url: "https://pandasportjersey.x.yupoo.com/albums/216420875?uid=1&isSubCate=false&referrercate=545635",
            albumId: "216420875"
        },
        temporada: "25/26",
        tipo: "tercera",
        tallas: "S-4XL"
    }
];

export default products;
