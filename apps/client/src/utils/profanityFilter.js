import filter from 'leo-profanity';

// Spanish profanity list (basic coverage)
const spanishBadWords = [
    // General / Insultos Comunes
    "puta", "putas", "putito", "putita", "putón", "putos", "puto",
    "joputa", "hijo de puta", "hijueputa", "hija de puta", "hijo de perra",
    "mierda", "mierdas", "come mierda", "comemierda",
    "cabron", "cabrones", "cabrona", "cabronas", "cabronazo",
    "pendejo", "pendejos", "pendeja", "pendejas", "pendejada",
    "imbecil", "imbécil", "imbeciles", "imbéciles",
    "idiota", "idiotas",
    "estupido", "estupida", "estupidos", "estupidas", "estúpido", "estúpida",
    "gilipollas", "gil", "giles", "agilipollado",
    "tonto", "tonta", "tontos", "tontas", "tontaco", "tontolaba",
    "tarado", "tarada", "tarados",
    "mongolo", "mongola", "mongolico", "mogolico", "mogólico", "mongol",
    "subnormal", "subnormales", "retrasado", "retrasada", "retrasados",
    "capullo", "capullos",
    "payaso", "payasa", "payasos",
    "bastardo", "bastarda", "bastardos",
    "maldito", "maldita", "malditos",
    "cornudo", "cornuda",
    "huevon", "huevón", "huevones",
    "mamaguevo", "mamahuevo", "mamanegas", "chupapollas", "lamerculos",

    // Sexuales / Anatomía
    "follar", "follada", "follador", "folladora", "follando",
    "chupar", "chupada", "chupala", "mamar", "mamada",
    "polla", "pollas", "pollon", "pollón", "pijudo",
    "pene", "penes", "prostata",
    "pito", "pitos", "cipote", "nabo", "verga", "vergas", "vergazo", "vergota", "vergon",
    "coño", "coños", "chocho", "cuca", "panocha", "tototo", "papo",
    "culo", "culos", "culero", "culeros", "ojete", "ano", "recto",
    "tetas", "teta", "tetona", "tetotas", "senos",
    "semen", "seme", "corrida", "esperma", "leche", "echaleche",
    "zorra", "zorras", "zorritas", "perra", "perras", "ramera", "furcia", "golfa", "guarra",
    "orgasmo", "anal", "oral", "sexo", "sexual", "porn", "porno", "xxx", "hentai", "cojedor",
    "concha", "conchas", "conchatumadre", "conchadelalora", "conchesumadre",
    "masturbar", "masturbacion", "paja", "pajas", "pajero", "pajera", "fap", "fapping",
    "clitoris", "vagina", "vulva", "virgo", "virgen", "incel", "simp",
    "pedofilo", "pederasta", "violador", "violar", "violacion", "violada", "acoso", "acosador",

    // Regionales - España
    "gilipollas", "capullo", "hostia", "cojones", "tocapelotas", "pagafantas", "bocachancla", "cuerpoescombro",
    "follaamigos", "follacabras", "me cago en", "mecagoen",

    // Regionales - México
    "chinga", "chingar", "chingada", "chingado", "chingados", "chingatumadre", "chingon",
    "pinche", "pinches", "cabron", "verguero", "culero", "mamon", "mamada", "no mames",
    "pendejo", "pendejada", "verga", "vergazos", "panocha", "puñetas",

    // Regionales - Argentina/Uruguay
    "boludo", "boluda", "boludos", "pelotudo", "pelotuda", "pelotudos",
    "forro", "forra", "conchuda", "conchudo", "pajero", "pajera",
    "trolo", "trola", "chanta", "culiado", "culiada", "sorere", "yegua",

    // Regionales - Colombia
    "gonorrea", "malparido", "malparida", "pirobo", "carechimba", "chimba",
    "cacorro", "gurrupleta", "lameculos", "sapo", "sapa", "perra", "perro", "bobo", "boba",

    // Regionales - Chile
    "weon", "weona", "weones", "aweonao", "aweonado", "wea", "weas",
    "culiao", "culia", "conchetumadre", "chucha", "pico", "raja", "flite",

    // Regionales - Venezuela
    "mamaguevo", "mamahuevo", "mamanegas", "coño", "coñoemadre", "coñoetumadre",
    "marico", "marica", "sifrino", "becerro", "ladilla",

    // Regionales - Perú
    "conchasumadre", "rechuchetumadre", "maricon", "cabro", "chivo", "cojudo",

    // Regionales - Otros (Caribe, Centroamérica)
    "pichula", "pichulas", "tototo", "bicho", "singar", "singado",
    "mmg", "guebon", "guevon", "buay", "fucking", // Spanglish común
    "verguenza", // a veces usado como insulto, depende contexto pero seguro filtrar

    // Discriminación / Odio
    "maricon", "maricones", "marica", "maricas", "maricón", "mariconazo",
    "bollera", "tortillera", "torta", "camionera", "travelo",
    "tranny", "shemale", "travesti", "trans",
    "nazi", "hitler", "racista", "xenofobo", "machista", "hembrista", "feminazi",
    "nigga", "nigger", "negrata", "sudaca", "panchito", "moro", "moros",
    "judio", "judios", // Contextual, pero a menudo usado ofensivamente en juegos
    "sidoso", "leproso", "cancer", "cancerigeno", "autista", "down", "mogolico",

    // Violencia / Muerte
    "suicida", "suicidio", "suicidate",
    "muerte", "matar", "asesino", "asesina", "asesinar",
    "violador", "violar", "violacion", "violada",

    // Escatológico
    "cagar", "cagada", "cagado", "cagon", "cagona", "cagas",
    "meada", "mear", "orin", "orina", "pis", "pichi",
    "vomito", "vomitar", "escupida", "escupitajo",
    "guarro", "guarra", "guarros", "cerdo", "cerda",
    "caca", "cacas", "mierda", "mierdas", "mojon", "mojón", "sorete", "soerte",
    "menstruacion", "menstruación", "regla", "leche", "corrida"
];

// Initialize filter
// Load English dict by default (already loaded usually, but good to ensure)
filter.loadDictionary('en');

// Add Spanish words
filter.add(spanishBadWords);

export const checkProfanity = (text) => {
    if (!text) return false;
    return filter.check(text);
};

export const cleanProfanity = (text, placeholder = '*') => {
    if (!text) return text;
    return filter.clean(text, placeholder);
};

export default filter;
