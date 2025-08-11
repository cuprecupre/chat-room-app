let words = [
  "casa", "árbol", "perro", "gato", "sol", "luna", "agua", "fuego", "tierra", "aire",
  "montaña", "río", "mar", "cielo", "nube", "estrella", "flor", "hoja", "fruta", "semilla",
  "hombre", "mujer", "niño", "niña", "familia", "amigo", "enemigo", "amor", "odio", "paz",
  "guerra", "vida", "muerte", "tiempo", "espacio", "color", "sonido", "luz", "oscuridad", "calor",
  "frío", "día", "noche", "mañana", "tarde", "invierno", "verano", "otoño", "primavera", "cuerpo",
  "mente", "alma", "corazón", "mano", "pie", "ojo", "boca", "nariz", "oreja", "pelo",
  "cabeza", "espalda", "brazo", "pierna", "dedo", "uña", "sangre", "hueso", "piel", "músculo",
  "nombre", "palabra", "letra", "número", "línea", "punto", "forma", "tamaño", "peso", "altura",
  "largo", "corto", "ancho", "estrecho", "grande", "pequeño", "rápido", "lento", "fuerte", "débil",
  "duro", "blando", "nuevo", "viejo", "joven", "anciano", "bueno", "malo", "feliz", "triste",
  "blanco", "negro", "rojo", "azul", "amarillo", "verde", "naranja", "morado", "gris", "marrón",
  "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve", "diez",
  "cien", "mil", "millón", "primero", "último", "otro", "mismo", "todo", "nada", "algo",
  "alguien", "nadie", "aquí", "allí", "cerca", "lejos", "dentro", "fuera", "arriba", "abajo",
  "delante", "detrás", "encima", "debajo", "entre", "sobre", "bajo", "con", "sin", "para",
  "por", "de", "a", "en", "y", "o", "pero", "si", "que", "como",
  "cuando", "donde", "quien", "cual", "porque", "aunque", "mientras", "siempre", "nunca", "también",
  "tampoco", "muy", "mucho", "poco", "más", "menos", "tan", "tanto", "así", "bien",
  "mal", "casi", "solo", "incluso", "hasta", "desde", "hacia", "contra", "según", "durante",
  "mediante", "vía", "salvo", "excepto", "además", "aparte", "inclusive", "exclusive", "yo", "tú",
  "él", "ella", "nosotros", "vosotros", "ellos", "ellas", "mi", "tu", "su", "nuestro",
  "vuestro", "mío", "tuyo", "suyo", "nuestro", "vuestro", "este", "ese", "aquel", "esto",
  "eso", "aquello", "ser", "estar", "haber", "tener", "hacer", "decir", "ir", "ver",
  "dar", "saber", "querer", "poder", "poner", "parecer", "quedar", "creer", "hablar", "llevar",
  "dejar", "seguir", "encontrar", "llamar", "venir", "pensar", "salir", "volver", "tomar", "conocer",
  "vivir", "sentir", "tratar", "mirar", "contar", "empezar", "esperar", "buscar", "entrar", "trabajar",
  "escribir", "perder", "producir", "ocurrir", "recibir", "recordar", "terminar", "permitir", "aparecer", "conseguir",
  "comenzar", "servir", "sacar", "necesitar", "mantener", "resultar", "leer", "caer", "cambiar", "presentar",
  "crear", "abrir", "considerar", "oír", "acabar", "convertir", "ganar", "formar", "traer", "partir",
  "morir", "aceptar", "realizar", "suponer", "comprender", "lograr", "explicar", "preguntar", "tocar", "estudiar",
  "alcanzar", "nacer", "dirigir", "correr", "utilizar", "pagar", "ayudar", "jugar", "escuchar", "cumplir",
  "ofrecer", "descubrir", "levantar", "intentar", "usar", "decidir", "repetir", "olvidar", "cerrar", "mover",
  "vender", "comprar", "viajar", "bailar", "cantar", "reír", "llorar", "dormir", "despertar", "comer",
  "beber", "cocinar", "lavar", "limpiar", "ordenar", "romper", "arreglar", "construir", "destruir", "enseñar",
  "aprender", "traducir", "firmar", "pintar", "dibujar", "soñar", "imaginar", "recordar", "olvidar", "amar",
  "odiar", "desear", "necesitar", "preferir", "gustar", "disgustar", "encantar", "fascinar", "interesar", "aburrir",
  "sorprender", "asustar", "preocupar", "calmar", "relajar", "cansar", "descansar", "doler", "sanar", "curar",
  "enfermar", "mejorar", "empeorar", "crecer", "decrecer", "aumentar", "disminuir", "aparecer", "desaparecer", "nacer",
  "morir", "vivir", "existir", "suceder", "pasar", "continuar", "detener", "empezar", "terminar", "comenzar",
  "acabar", "iniciar", "finalizar", "abrir", "cerrar", "subir", "bajar", "entrar", "salir", "venir",
  "ir", "llegar", "partir", "quedarse", "moverse", "pararse", "sentarse", "levantarse", "acostarse", "despertarse",
  "vestirse", "desvestirse", "bañarse", "ducharse", "peinarse", "maquillarse", "afeitarse", "lavarse", "secarse", "ponerse",
  "quitarse", "atar", "desatar", "abrochar", "desabrochar", "calzar", "descalzar", "probar", "elegir", "escoger",
  "seleccionar", "separar", "juntar", "unir", "mezclar", "cortar", "pegar", "doblar", "desdoblar", "llenar",
  "vaciar", "pesar", "medir", "contar", "calcular", "sumar", "restar", "multiplicar", "dividir", "comparar",
  "igualar", "diferenciar", "ordenar", "desordenar", "clasificar", "agrupar", "analizar", "sintetizar", "resumir", "ampliar",
  "reducir", "copiar", "pegar", "borrar", "escribir", "leer", "dictar", "deletrear", "pronunciar", "silenciar",
  "gritar", "susurrar", "hablar", "callar", "preguntar", "responder", "afirmar", "negar", "dudar", "creer",
  "opinar", "sugerir", "aconsejar", "recomendar", "pedir", "exigir", "mandar", "ordenar", "prohibir", "permitir",
  "invitar", "agradecer", "felicitar", "disculparse", "perdonar", "saludar", "despedirse", "presentar", "conocer", "reconocer",
  "ignorar", "atender", "escuchar", "oír", "ver", "mirar", "observar", "buscar", "encontrar", "perder",
  "mostrar", "ocultar", "tocar", "sentir", "oler", "gustar", "probar", "saborear", "pensar", "imaginar",
  "soñar", "recordar", "olvidar", "saber", "conocer", "aprender", "estudiar", "enseñar", "comprender", "entender",
  "ignorar", "dudar", "creer", "suponer", "planear", "decidir", "intentar", "lograr", "conseguir", "fracasar",
  "rendirse", "luchar", "pelear", "competir", "colaborar", "ayudar", "molestar", "fastidiar", "divertir", "aburrir",
  "entretener", "jugar", "trabajar", "descansar", "viajar", "pasear", "correr", "caminar", "nadar", "volar",
  "conducir", "montar", "bailar", "cantar", "tocar", "pintar", "dibujar", "fotografiar", "filmar", "actuar",
  "dirigir", "producir", "crear", "inventar", "descubrir", "explorar", "investigar", "experimentar", "probar", "demostrar",
  "verificar", "confirmar", "refutar", "argumentar", "debatir", "discutir", "conversar", "charlar", "negociar", "acordar",
  "pactar", "prometer", "jurar", "mentir", "engañar", "traicionar", "confiar", "desconfiar", "respetar", "admirar",
  "criticar", "juzgar", "valorar", "evaluar", "medir", "calificar", "aprobar", "suspender", "castigar", "premiar",
  "recompensar", "agradecer", "elogiar", "insultar", "amenazar", "proteger", "defender", "atacar", "luchar", "rendirse",
  "ganar", "perder", "empatar", "celebrar", "lamentar", "sufrir", "disfrutar", "gozar", "padecer", "soportar",
  "aguantar", "resistir", "cansarse", "agotarse", "recuperarse", "mejorar", "empeorar", "sanar", "curar", "enfermar",
  "herir", "matar", "asesinar", "salvar", "rescatar", "ayudar", "perjudicar", "beneficiar", "favorecer", "dañar",
  "reparar", "arreglar", "romper", "destruir", "construir", "fabricar", "producir", "generar", "crear", "consumir",
  "gastar", "ahorrar", "invertir", "ganar", "perder", "robar", "prestar", "devolver", "pagar", "cobrar",
  "vender", "comprar", "alquilar", "reservar", "cancelar", "cambiar", "devolver", "enviar", "recibir", "transportar",
  "viajar", "visitar", "explorar", "acampar", "pescar", "cazar", "cultivar", "cosechar", "plantar", "regar",
  "cuidar", "proteger", "alimentar", "criar", "educar", "formar", "instruir", "guiar", "orientar", "aconsejar",
  "motivar", "inspirar", "influir", "persuadir", "convencer", "manipular", "controlar", "dominar", "liberar", "independizar",
  "unir", "separar", "dividir", "organizar", "planificar", "gestionar", "administrar", "dirigir", "liderar", "gobernar",
  "legislar", "juzgar", "ejecutar", "obedecer", "rebelarse", "protestar", "manifestarse", "votar", "elegir", "participar",
  "colaborar", "competir", "comunicar", "informar", "expresar", "opinar", "criticar", "elogiar", "debatir", "dialogar",
  "negociar", "acordar", "resolver", "solucionar", "crear", "innovar", "investigar", "descubrir", "aprender", "enseñar",
  "evaluar", "medir", "analizar", "interpretar", "predecir", "imaginar", "diseñar", "desarrollar", "implementar", "mantener",
  "actualizar", "mejorar", "optimizar", "adaptar", "personalizar", "configurar", "instalar", "desinstalar", "conectar", "desconectar",
  "activar", "desactivar", "iniciar", "finalizar", "pausar", "reanudar", "guardar", "cargar", "exportar", "importar",
  "sincronizar", "compartir", "publicar", "privatizar", "proteger", "asegurar", "encriptar", "desencriptar", "verificar", "autenticar",
  "autorizar", "denegar", "registrar", "monitorizar", "auditar", "reportar", "alertar", "notificar", "consultar", "buscar",
  "filtrar", "ordenar", "agrupar", "visualizar", "imprimir", "escanear", "fotocopiar", "faxear", "llamar", "textear"
];

// --- Generación de palabras variadas (~1000) ---
// Categorías base (concisas para mantener el archivo ligero)
const baseNouns = [
  "cuchara","tenedor","cuchillo","plato","vaso","taza","silla","mesa","puerta","ventana",
  "pared","techo","suelo","lámpara","escoba","bolso","cartera","reloj","llave","botella",
  "mochila","bicicleta","patinete","patineta","balón","pelota","raqueta","red","casco","guante",
  "pizza","tortilla","empanada","arepa","ensalada","sopa","arroz","fideo","asado","tarta",
  "manzana","banana","naranja","pera","uva","limón","sandía","melón","frutilla","mango",
  "ciudad","pueblo","aldea","barrio","plaza","parque","estadio","museo","mercado","puerto",
  "bosque","desierto","playa","acantilado","valle","pradera","selva","glaciar","caverna","volcán",
  "computadora","portátil","teclado","ratón","pantalla","altavoz","auricular","micrófono","cámara","impresora",
  "camisa","pantalón","abrigo","chaqueta","falda","vestido","zapato","zapatilla","gorra","sombrero",
  "tren","avión","barco","cohete","subte","metro","autobús","taxi","camión","moto",
  "martillo","destornillador","alicate","llave inglesa","sierra","taladro","cincel","lija","regla","cinta",
  "periódico","revista","libro","cuaderno","agenda","diccionario","mapa","calendario","póster","sobre",
  "perla","oro","plata","bronce","hierro","acero","madera","plástico","vidrio","cerámica",
  "perro","gato","caballo","vaca","oveja","cabra","cerdo","pollo","pato","ganso",
  "águila","halcón","búho","loro","tucán","pez","delfín","ballena","tiburón","foca"
];

const adjectives = [
  "rojo","azul","verde","amarillo","morado","rosa","negro","blanco","gris","marrón",
  "alto","bajo","largo","corto","ancho","estrecho","rápido","lento","fuerte","débil",
  "dulce","amargo","salado","ácido","suave","duro","caliente","frío","limpio","sucio",
  "nuevo","viejo","moderno","clásico","caro","barato","ligero","pesado","raro","común"
];

const professions = [
  "doctor","actor","pintor","panadero","carpintero","mecánico","ingeniero","diseñador","arquitecto","abogado",
  "profesor","enfermero","periodista","bombero","policía","camionero","electricista","fontanero","cocinero","jardinero",
  "músico","cantante","bailarín","deportista","programador","analista","gestor","contador","fotógrafo","agricultor"
];

const emotions = [
  "alegría","tristeza","miedo","ira","sorpresa","asco","calma","ansiedad","orgullo","vergüenza",
  "esperanza","nostalgia","culpa","paz","euforia","melancolía","ternura","envidia","celos","compasión"
];

const tech = [
  "algoritmo","base de datos","servidor","cliente","protocolo","enlace","paquete","byte","bit","nube",
  "repositorio","rama","commit","despliegue","contenedor","imagen","token","credencial","caché","latencia"
];

const sports = [
  "fútbol","baloncesto","tenis","natación","atletismo","ciclismo","boxeo","esgrima","gimnasia","voley",
  "rugby","béisbol","golf","hockey","surf","escalada","remo","patinaje","yoga","pilates"
];

const verbs = [
  "correr","saltar","caminar","nadar","volar","cocinar","leer","escribir","dibujar","pintar",
  "construir","romper","arreglar","comprar","vender","enseñar","aprender","cantar","bailar","soñar",
  "jugar","pensar","creer","hablar","escuchar","mirar","viajar","programar","probar","medir",
  "iniciar","finalizar","conectar","desconectar","guardar","cargar","compartir","publicar","proteger","verificar"
];

// Utilidades básicas
const uniq = arr => Array.from(new Set(arr));
const toASCII = (s) => s.normalize('NFD').replace(/\p{Diacritic}+/gu, '');
const lowerASCII = (s) => toASCII(String(s)).toLowerCase();
const pluralize = (w) => {
  if (/z$/i.test(w)) return w.replace(/z$/i, "ces");
  if (/[aeiouáéíóú]$/i.test(w)) return w + "s";
  return w + "es";
};
const feminine = (w) => w.replace(/o$/i, "a");
const gerund = (v) => v.replace(/(ar)$/i, "ando").replace(/(er|ir)$/i, "iendo");
const participle = (v) => v.replace(/(ar)$/i, "ado").replace(/(er|ir)$/i, "ido");
const present3s = (v) => v.replace(/ar$/i, "a").replace(/(er|ir)$/i, "e");

// Sufijos comunes para sustantivos (diminutivo/augmentativo)
const nounWithSuffixes = (w) => {
  const base = w;
  const toRoot = (s) => s.replace(/a$|o$/i, "");
  const root = toRoot(base);
  const fem = feminine(base);
  return [
    base, pluralize(base), fem, pluralize(fem),
    root + "ito", root + "ita", root + "azo", root + "aza"
  ];
};

// Generación
let generated = [];
// Sustantivos + variantes
for (const n of baseNouns) generated.push(...nounWithSuffixes(n));
// Adjetivos: formas masc/fem + plural
for (const a of adjectives) {
  const femA = feminine(a);
  generated.push(a, femA, pluralize(a), pluralize(femA));
}
// Profesiones: masc/fem + plural
for (const p of professions) {
  let femP = p;
  if (/or$/i.test(p)) femP = p + "a".replace(/ora$/, "ora");
  else if (/o$/i.test(p)) femP = feminine(p);
  generated.push(p, femP, pluralize(p), pluralize(femP));
}
// Emociones y tecnología, deportes (solo plural adicional cuando aplica)
for (const e of emotions.concat(tech, sports)) {
  generated.push(e);
  if (!/\s/.test(e)) generated.push(pluralize(e));
}
// Verbos: gerundio, participio, 3ª persona
for (const v of verbs) generated.push(v, gerund(v), participle(v), present3s(v));

// Stopwords: artículos, preposiciones, conjunciones, determinantes/pronombres comunes
const stopwords = new Set([
  'el','la','los','las','lo','un','una','unos','unas','al','del',
  'a','ante','bajo','cabe','con','contra','de','desde','durante','en','entre','hacia','hasta','mediante','para','por','segun','sin','so','sobre','tras','versus','via',
  'y','e','ni','o','u','pero','mas','sino','aunque','que','como','si','porque','mientras','tambien','tampoco','muy','mucho','poco','mas','menos','tan','tanto','asi','bien','mal',
  'yo','tu','usted','el','ella','ello','nosotros','vosotros','ellos','ellas','mi','mis','tu','tus','su','sus','nuestro','nuestra','nuestros','nuestras','vuestro','vuestra','vuestros','vuestras',
  'este','esta','estos','estas','ese','esa','esos','esas','aquel','aquella','aquellos','aquellas','esto','eso','aquello'
]);

// Consolidar, deduplicar y recortar a 1000 entradas
let pool = uniq(words.concat(generated))
  .filter(w => typeof w === 'string')
  .map(w => w.normalize('NFC'))
  // excluir frases con espacios o guiones largos poco útiles
  .filter(w => !/\s/.test(w))
  // excluir tokens demasiado cortos
  .filter(w => w.length >= 3)
  // excluir stopwords (comparación insensible a acentos)
  .filter(w => !stopwords.has(lowerASCII(w)));

// Mezclar de forma simple para variedad
for (let i = pool.length - 1; i > 0; i--) {
  const j = Math.floor((Math.sin(i * 9301 + 49297) % 1 + 1) % 1 * (i + 1));
  [pool[i], pool[j]] = [pool[j], pool[i]];
}

words = pool.slice(0, 1000);

module.exports = words;
