// Banco estático de palabras organizado por temáticas (sin diminutivos)
const wordCategories = {
  "Naturaleza": [
    "casa","árbol","perro","gato","sol","luna","agua","fuego","tierra","aire","montaña","río","mar","cielo","nube","estrella","flor","hoja","fruta","semilla","bosque","desierto","playa","valle","pradera","selva","volcán"
  ],
  "Cuerpo humano": [
    "cuerpo","mente","alma","corazón","mano","pie","ojo","boca","nariz","oreja","pelo","cabeza","espalda","brazo","pierna","dedo","uña","sangre","hueso","piel","músculo"
  ],
  "Colores": [
    "blanco","negro","rojo","azul","amarillo","verde","naranja","morado","gris","marrón","rosa"
  ],
  "Números": [
    "uno","dos","tres","cuatro","cinco","seis","siete","ocho","nueve","diez","cien","mil","millón"
  ],
  "Familia y personas": [
    "hombre","mujer","niño","niña","familia","amigo","enemigo"
  ],
  "Profesiones": [
    "doctor","actor","pintor","panadero","carpintero","mecánico","ingeniero","diseñador","arquitecto","abogado","profesor","enfermero","periodista","bombero","policía","camionero","electricista","fontanero","cocinero","jardinero","músico","cantante","bailarín","deportista","programador","analista","gestor","contador","fotógrafo","agricultor"
  ],
  "Objetos del hogar": [
    "cuchara","tenedor","cuchillo","plato","vaso","taza","silla","mesa","puerta","ventana","pared","techo","suelo","lámpara","escoba","bolso","cartera","reloj","llave","botella"
  ],
  "Tecnología": [
    "computadora","portátil","teclado","ratón","pantalla","altavoz","auricular","micrófono","cámara","impresora","algoritmo","servidor","cliente","protocolo","paquete","byte","bit","nube","repositorio","rama","commit","despliegue","contenedor","imagen","token","credencial","caché","latencia"
  ],
  "Transporte": [
    "tren","avión","barco","cohete","metro","autobús","taxi","camión","moto","bicicleta"
  ],
  "Herramientas": [
    "martillo","destornillador","alicate","llave inglesa","sierra","taladro","cincel","lija","regla","cinta"
  ],
  "Materiales": [
    "perla","oro","plata","bronce","hierro","acero","madera","plástico","vidrio","cerámica"
  ],
  "Deportes": [
    "fútbol","baloncesto","tenis","natación","atletismo","ciclismo","boxeo","esgrima","gimnasia","voley","rugby","béisbol","golf","hockey","surf","escalada","remo","patinaje","yoga","pilates"
  ],
  "Animales": [
    "caballo","vaca","oveja","cabra","cerdo","pollo","pato","ganso","águila","halcón","búho","loro","tucán","pez","delfín","ballena","tiburón","foca"
  ],
  "Alimentos": [
    "pizza","tortilla","empanada","arepa","ensalada","sopa","arroz","fideo","asado","tarta","manzana","banana","naranja","pera","uva","limón","sandía","melón","mango"
  ],
  "Lugares": [
    "ciudad","pueblo","aldea","barrio","plaza","parque","estadio","museo","mercado","puerto","acantilado","glaciar","caverna"
  ],
  "Verbos comunes": [
    "correr","saltar","caminar","nadar","volar","cocinar","leer","escribir","dibujar","pintar","construir","romper","arreglar","comprar","vender","enseñar","aprender","cantar","bailar","soñar","jugar","pensar","creer","hablar","escuchar","mirar","viajar","programar","probar","medir","iniciar","finalizar","conectar","desconectar","guardar","cargar","compartir","publicar","proteger","verificar"
  ],
  "Emociones": [
    "alegría","tristeza","miedo","ira","sorpresa","asco","calma","ansiedad","orgullo","vergüenza","esperanza","nostalgia","culpa","paz","euforia","melancolía","ternura","envidia","celos","compasión"
  ]
};

const wordsFlat = Object.entries(wordCategories).flatMap(([category, arr]) => arr.map((word) => ({ word, category })));

function getRandomWordWithCategory() {
  const idx = Math.floor(Math.random() * wordsFlat.length);
  return wordsFlat[idx];
}

module.exports = { wordCategories, words: wordsFlat, getRandomWordWithCategory };
