/*
Sitio del objetivo: https://15.ai
CMUdict: http://www.speech.cs.cmu.edu/cgi-bin/cmudict
Referencia para los equivalentes de CMUdict en español:
	https://www.lumenvox.com/knowledgebase/index.php?/article/AA-01086/0/Mexican-Spanish-Phonemes.html
	https://www.phon.ucl.ac.uk/home/sampa/spanish.htm
Algoritmo de separación en sílabas: https://github.com/nicofrem/silabajs

Uso:
oracionTo15ai(
	'Si el grandote pinta para el fondo, va a haber quilombo.'
	,'You better not mess with us.'
);
La oración en inglés es para darle contexto emocional.
Hay que tener en cuenta el límite de caracteres en 15.ai .
*/

function oracionTo15ai(oracion,oracionEnIngles=''){
	let resultado='';
	oracion=oracion.trim().toLowerCase()
		//Quitar espacios innecesarios
		.replace(/ *(,|¿|¡) */g,',')
		.replace(/ *(\p{P}) */gu,'$1')
		.replace(/ {2,}/g,' ');

		let previoEraPuntuacion=true
		,pedazos=oracion.split(' ')
		,puntuaciones=/\p{P}/u
		,añadirPalabra=(palabra,puntuacion='')=>resultado+='{'+PalabraUtils.toARPAbet(palabra)+'}'+puntuacion;
		
	for(let pedazo of pedazos){
		let palabraActual='';
		for(let char of pedazo){
			let esteEsPuntuacion=puntuaciones.test(char);
			if(esteEsPuntuacion){
				if(!previoEraPuntuacion){
					añadirPalabra(palabraActual,char);
					palabraActual='';
				}
			}else palabraActual+=char;
			
			previoEraPuntuacion=esteEsPuntuacion;
		}
		if(palabraActual)
			añadirPalabra(palabraActual);
	}
	oracionEnIngles=oracionEnIngles.trim();
	return oracionEnIngles?
		resultado+'|'+oracionEnIngles
		:resultado;
}

const PalabraUtils={
	getSilabas:function(palabra){
		palabra=palabra.toLowerCase().trim();
		
		let silabaAux
			,encontroTonica=false
			,silabas=[];

		// Se recorre la palabra buscando las sílabas
		for (let actPos = 0; actPos < palabra.length;) {
			silabaAux = {esTonica:0};
			
			let hayTilde=false
				,inicioPosicion=actPos
				,esTonica=false;

			// Las sílabas constan de tres partes: ataque, núcleo y coda
			
			// Ataque
			let ultimaConsonante = 'a';
			// Se considera que todas las consonantes iniciales forman parte del ataque
			while (
				(actPos < palabra.length)
				&& this.esConsonante(palabra[actPos])
				&& palabra[actPos] != 'y'
			)
				ultimaConsonante = palabra[actPos++];

			// (q | g) + u (ejemplo: queso, gueto)
			if (actPos < palabra.length - 1)
				if (palabra[actPos] == 'u') {
					if (
						ultimaConsonante == 'q'
						||(
							ultimaConsonante == 'g'
							&& 'eéií'.includes(palabra [actPos + 1])
						)
					)
						actPos++;
				}else if (palabra[actPos] == 'ü' && ultimaConsonante == 'g') // La u con diéresis se añade a la consonante
					actPos++;
			
			// Núcleo
			let anterior = 0
        ,char;
        // 0 = fuerte
        // 1 = débil acentuada
        // 2 = débil

			if (!(actPos >= palabra.length)){
				// Se salta una 'y' al principio del núcleo, considerándola consonante
				if (palabra[actPos] == 'y')
					actPos++;

				let seguir=true;
					
				// Primera vocal
				if (actPos < palabra.length) {
					char = palabra[actPos];
						
					if ('áàéèóò'.includes(char)){
						// Vocal fuerte o débil acentuada
						hayTilde=true;
						esTonica = true;
						anterior = 0;
						actPos++;
					}else if ('aeo'.includes(char)){
						// Vocal fuerte
						anterior = 0;
						actPos++;
					}else if ('íìúùü'.includes(char)){
						// Vocal débil acentuada, rompe cualquier posible diptongo
						if(char!='ü')
							hayTilde=true;
						anterior = 1;
						actPos++;
						esTonica = true;
						seguir=false;
					}else if ('iu'.includes(char)){
						// Vocal débil
						anterior = 2;
						actPos++;
					}
				}
				
				if(seguir){
					// 'h' intercalada en el núcleo, no condiciona diptongos o hiatos
					let hache = false;
					if (actPos < palabra.length && palabra[actPos] == 'h') {
						actPos++;
						hache = true;
					}
	
					// Segunda vocal
					if (actPos < palabra.length) {
						char = palabra[actPos];
						
						if ('áàéèóò'.includes(char)){
							// Vocal fuerte o débil acentuada
							hayTilde=true;
							if (anterior) {
									esTonica = true;
									actPos++;
							}else{
								// Dos vocales fuertes no forman silaba
								if (hache)
									actPos--;
								seguir=false;
							}
						}else if ('aeo'.includes(char)){
							// Vocal fuerte
							if(anterior)
								actPos++;
							else {    // Dos vocales fuertes no forman silaba
								if (hache)
									actPos--;
								seguir=false;
							}
						}else if ('íìúùü'.includes(char)){
							// Vocal débil acentuada, rompe cualquier posible diptongo
							if(char!='ü')
								hayTilde=true;

							if (anterior) {  // Se forma diptongo
								esTonica = true;
								actPos++;
							}else if (hache)
								actPos--;

							seguir=false;
						}else if ('iu'.includes(char)){
							// Vocal débil
							if (actPos < palabra.length - 1 && !this.esConsonante(palabra [actPos + 1])) {
								// ¿Hay tercera vocal?
								if (palabra[actPos - 1] == 'h')
									actPos--;
							}else if (palabra [actPos] != palabra [actPos - 1])
								// dos vocales débiles iguales no forman diptongo
								actPos++;
								
							// Es un diptongo plano o descendente
							seguir=false;
						}
					}
	
					// ¿tercera vocal?
					if(seguir && actPos < palabra.length) {
						char = palabra[actPos];
						if (char == 'i' || char == 'u') // Vocal débil
							actPos++; // Es un triptongo
					}
				}
			}
			
			// Coda
			actPos = ((pos)=>{
				if (pos >= palabra.length || !this.esConsonante(palabra[pos]))
						return pos; // No hay coda
				if (pos == palabra.length - 1) // Final de palabra
					return pos+1;
				
				// Si sólo hay una consonante entre vocales, pertenece a la siguiente silaba
				if (!this.esConsonante(palabra [pos + 1]))
					return pos;
		
				let c1 = palabra[pos]
					,c2 = palabra[pos + 1];
		
				// ¿Existe posibilidad de una tercera consonante consecutina?
				if (pos < palabra.length - 2) {
					let c3 = palabra [pos + 2];
		
					if (!this.esConsonante(c3)){ // No hay tercera consonante
						if (
							(c1 == 'l' && c2 == 'l')
							||(c1 == 'c' && c2 == 'h')
							||(c1 == 'r' && c2 == 'r')
						)
							return pos;
							
						///////// grupos nh, sh, rh, hl son ajenos al español(DPD)
						if (
							(c1 != 's')
							&& (c1 != 'r')
							&& (c2 == 'h')
						)
							return pos;
		
							// Si la y está precedida por s, l, r, n o c (consonantes alveolares), una nueva silaba empieza en la consonante previa, si no, empieza en la y
						if (c2 == 'y')
							return 'slrnc'.includes(c1)?
								pos
								:pos+1;
		
						// gkbvpft + l
						if (
							'gkbvpft'.includes(c1)
							&& c2 == 'l'
						)
							return pos;
							
						// gkdtbvpf + r
						if (
							'gkdtbvpf'.includes(c1)
							&& c2 == 'r'
						)
							return pos;
		
						return pos+1;
					}else{ // Hay tercera consonante
						if ((pos + 3) == palabra.length) { // Tres consonantes al final ¿palabras extranjeras?
							if (
								c2 == 'y' //{ // 'y' funciona como vocal
								&& 'slrnc'.includes(c1)
							)
								return pos;
		
							// 'y' final funciona como vocal con c2
							return c3 == 'y'?
								pos+1
							// Tres consonantes al final ¿palabras extranjeras?
								:pos+3;
						}
						
						if (c2 == 'y') // 'y' funciona como vocal
							return !'slrnc'.includes(c1)?
								pos+1
								:pos;
		
						// Los grupos pt, ct, cn, ps, mn, gn, ft, pn, cz, tz, ts comienzan silaba (Bezos)
						if (['pt', 'ct', 'cn', 'ps', 'mn', 'gn', 'ft', 'pn', 'cz', 'tz', 'ts' ].includes(c2+c3))
								return pos+1;
		
						return pos+(
							(
								c3 == 'l' || c3 == 'r' || // Los grupos consonánticos formados por una consonante seguida de 'l' o 'r' no pueden separarse y siempre inician sílaba
								(c2 == 'c' && c3 == 'h') || // 'ch'
								(c3 == 'y') // 'y' funciona como vocal
							)?
								1 // Siguiente sílaba empieza en c2
								:2 // c3 inicia la siguiente sílaba
						);
					}
				}else if (c2 != 'y')
					return pos + 2; // La palabra acaba con dos consonantes
				return pos;
			})(actPos);

			silabaAux.texto = palabra.substring(inicioPosicion, actPos);
			
			// Marca la silaba tónica
			if (esTonica && !encontroTonica)
				silabaAux.esTonica = encontroTonica = hayTilde?2:1;
					
			silabas.push(silabaAux);
		}

		// Si no se ha encontrado la sílaba tónica (no hay tilde), se determina en base a las reglas de acentuación
		if (!encontroTonica) {
			if (silabas.length ==1)// Monosílabos
				silabas[0].esTonica = /[aeiou]{2}/.test(silabas[0].texto)?1:0;
				// Para diferenciar monosílabos con tilde diacrítica. 
			else { // Polisílabos
				let letraFinal = palabra[palabra.length - 1];
				if (
					(!this.esConsonante(letraFinal) || (letraFinal == 'y'))
					||(
						(letraFinal == 'n')
						|| (letraFinal == 's')
						&& !this.esConsonante(palabra[palabra.length - 2])
					)
				)
					silabas[silabas.length-2].esTonica=1; // Palabra grave
				else silabas[silabas.length-1].esTonica=1; // Palabra aguda
			}
		}
		
		return silabas;
	}
	,vocalFuerte:letra=>'aáàeéèíìoóòúù'.includes(letra)
	,esConsonante:letra=>!'aáàeéèíìoóòúùiuü'.includes(letra)
	,toARPAbet:function(palabra){
		let silabas=this.getSilabas(palabra)
			,ARPAbet=[]
			,vocales={
				'a':'AA'
				,'e':'EY'
				,'i':'IY'
				,'si':'Y'
				,'o':'OW'
				,'u':'UW'
				,'su':'W'
			}
			,reemplazos={
				'1':'CH'
				,'j':'HH'
				// ,'ñ':'GN' //15ai no soporta GN
				,'ñ':'N IY0'
				,'x':'XH'
				,'z':'S'
			}
			,defaultAdd=letra=>ARPAbet.push(reemplazos[letra]||letra.toUpperCase());
		for(let [i,silaba] of Object.entries(silabas)){
			//reemplazar letras por sonidos
			silaba.texto=silaba.texto.replace(/(ch)|(ll)|(h)|(c([aou]))|(c([ei]))|(qu)|(g([ei]))|(v)|(rr)|(gu([ei]))/g,(str,ch,ll,h,cacocu,aou,ceci,eic,qu,gegi,eig,v,rr,guegui,eigu)=>{
				if(ch)
					return '1';
				if(ll)
					return 'y';
				if(h)
					return '';
				if(cacocu)
					return 'k'+aou;
				if(ceci)
					return 's'+eic;
				if(qu)
					return 'k';
				if(gegi)
					return 'j'+eig;
				if(v)
					return 'b';
				if(rr)
					return 'r';
				if(guegui)
					return 'g'+eigu;
			});
			
			for(let [j,letra] of Object.entries(silaba.texto)){
				if('aeiou'.includes(letra)){
					switch(silaba.esTonica){
					case 2:
						ARPAbet.push(vocales[letra]+'1');
						break;
					case 1:
						if(!/[aeiou]{2}/.test(silaba.texto)){
							ARPAbet.push(vocales[letra]+'1');
							break;
						}else{
							silaba.esTonica=2;
							if(letra=='i' || letra=='u'){
								ARPAbet.push(vocales['s'+letra]);
								break;
							}
						}
					case 0:
						ARPAbet.push(vocales[letra]+'0');
					}
					continue;
				}else if('áéíóúàèìòù'.includes(letra)){
					ARPAbet.push(vocales[letra.normalize("NFD")[0]]+'1');
					continue;
				}else if(letra=='g' || letra=='d'){
					if(j+1==silaba.length || !this.esConsonante(silaba[j+1])){
						ARPAbet.push(letra+'H');
						continue;
					}
				}else if(letra=='t'){
					if(j+1!=silaba.length && 'zs'.includes(silaba[j+1])){
						ARPAbet.push('TS');
						continue;
					}
				}else if(letra=='n'){
					if(!(i+1==silabas.length && j+1==silaba.length)){
						let next=(j+1==silaba.length)?
							silabas[i][0]
							:silaba[j+i];
						if(next=='k' || next=='g'){
							ARPAbet.push('NG');
							continue;
						}
					}
				}else if(letra=='y'){
					if(i+1==silabas.length && j+1==silaba.length){
						ARPAbet.push('IY0');
						continue;
					}
				}
				
				defaultAdd(letra);
			}
		}
		return ARPAbet.join(' ');
	}
}