import { Browser, Page } from "puppeteer";
import readline from "readline/promises";

// URL del buscador de cursos
const URL = "https://sia.unal.edu.co/Catalogo/facespublico/public/servicioPublico.jsf?taskflowId=task-flow-AC_CatalogoAsignaturas";

// IDs de varios elementos del buscador de cursos
enum FormId {
	NivelEstudio = "pt1:r1:0:soc1::content",
	Sede = "pt1:r1:0:soc9::content",
	Facultad = "pt1:r1:0:soc2::content",
	Plan = "pt1:r1:0:soc3::content",
	Tipologia = "pt1:r1:0:soc4::content",
	DeseasBuscar = "pt1:r1:0:soc5::content",
	SedeLE = "pt1:r1:0:soc10::content",
	FacultadLE = "pt1:r1:0:soc6::content",
	PlanLE = "pt1:r1:0:soc7::content",
	Nombre = "pt1:r1:0:it11::content",
	Mostrar = "pt1:r1:0:cb1",
	ResultadoDiv = "pt1:r1:0:pb3",
	ResultadoTabla = "pt1:r1:0:t4::db",
}

// Opción de etiqueta <select>
interface SelectOption {
	value: string;
	title: string;
}

// Curso | Resultado de la búsqueda del buscador de cursos
interface Result {
	id: string;
	index: number;
	code: string;
	name: string;
}

// Grupo de un curso
interface Group {
	number: number;
	teacher: string;
	places: number;
}

// Estados del tracker
export enum Status {
	Init,
	Ready,
	Tracking
}

// Error de llenado del formulario
class FormError extends Error {
	constructor(message: string) {
		super();
		this.name = "FormError";
		this.message = message;
	}
}

export class Tracker {
	static browser: Browser; // Browser de Puppeteer
	static rl: readline.Interface; // Instancia de readline/promises
	private page: Page; // Página utilizada por el tracker
	static notify: ((title: string, message: string) => void); // Función para notificar
	private writeLog: boolean = true; // Controla escritura del tracker

	private course?: Result;
	private group?: Group;
	private status: Status = Status.Init;

	private query = "";
	private data: any = {}; //Datos ingresados en el formulario

	/**
	* Crea un nuevo tracker
	*
	* @class
	* @param {string} page - Nueva página de Puppeteer
	*/
	constructor(page: Page) {
		this.page = page;
	}

	/**
	* Inicializa el tracker hasta que esté listo para seguir
	*/
	public async init() {
		while (this.status == Status.Init) {
			try {
				await this.search();
			} catch (e: any) {
				this.log(e.message);
				this.log("Reiniciando...");
				this.page.close();
				if (e instanceof FormError) {
					this.data = {};
					this.query = "";
				} else {
					await new Promise(r => setTimeout(r, 3000));
				}
				this.page = await Tracker.browser.newPage();
			}
		}
		this.status = Status.Ready;
		this.writeLog = false;
		this.keepAlive();
	}

	/**
	* Actualiza el grupo actual cada cantidad de segundos
	*
	* @param {number} timeout - Intervalo de tiempo en segundos
	*/
	public async track(timeout: number) {
		this.status = Status.Tracking;
		let oldPlaces = 0; // Guarda los cupos anteriores para compararlos con los nuevos
		while (this.status = Status.Tracking) {
			await this.page.waitForNetworkIdle();
			try {
				await this.refreshAndGet();
			} catch (e) {
				this.log("Error actualizando los cursos\nReiniciando...");
				this.status = Status.Init;
				await this.init();
				this.status = Status.Tracking;
			}
			if (this.group!.places != oldPlaces) {
				Tracker.notify(this.course!.name, `¡Ahora hay ${this.group?.places} cupos disponibles en el grupo ${this.group?.number} con ${this.group?.teacher}!`);
				oldPlaces = this.group!.places;
			}
			await new Promise(r => setTimeout(r, timeout >= 30000 ? timeout : 30000));
		}
	}

	public getCourse() {
		return this.course;
	}

	public getGroup() {
		return this.group;
	}

	public getStatus(): string {
		let status: string;
		switch (this.status) {
			case Status.Init:
				status = "Inicializando";
				break;
			case Status.Ready:
				status = "Listo";
				break;
			case Status.Tracking:
				status = "Siguiendo";
				break;
			default:
				status = "";
				break;
		}
		return status;
	}

	private log(message: string, newline: boolean = true) {
		if (this.writeLog) {
			if (newline) message += "\n";
			process.stdout.write(message);
		}
	}

	/**
	* Refresca la página y actualiza el grupo actual
	*/
	private async refreshAndGet() {
		let group: Group;
		await this.page.reload();
		group = await this.page.evaluate((number) => {
			// Extrae y retorna la información
			let div = document.querySelector(`[id$=\"${number - 1}:pgl7\"]`)!;
			let group: Group = {
				number: number,
				teacher: (() => div.querySelector("[id$=ot8]")!.innerHTML.trim())(),
				places: (() => Number(div.querySelector("[id$=ot24]")!.innerHTML))()
			}
			return group;
		}, this.group!.number)
		this.group = group;
	}

	/**
	* Se encarga de mantener activa la sesión mientras se configuran otros trackers
	*/
	private async keepAlive() {
		while (this.status == Status.Ready) {
			await this.page.reload();
			await new Promise(r => setTimeout(r, 60000));
		}
	}

	/**
	* Llena el formulario de búsqueda del SIA
	*/
	private async search() {
		this.log("Ingresando al SIA... ", false);
		await this.page.goto(URL);
		this.log("✓\n");
		this.log("Llenando formulario...");
		await this.page.evaluate(() => {
			// #d1 es un div que tiene altura 1 cuando la página se carga incorrectamente
			if (document.querySelector("#d1")?.clientHeight == 1) {
				throw new Error("La página no se cargó correctamente");
			}
		});
		await this.select("Seleccione nivel de estudio:", FormId.NivelEstudio);
		await this.waitForSelect(FormId.Sede);
		await this.select("Seleccione sede: ", FormId.Sede);
		if (this.data[FormId.Sede] != "0") await this.waitForSelect(FormId.Facultad);
		await this.select("Seleccione facultad: ", FormId.Facultad);
		await this.waitForSelect(FormId.Plan);
		await this.select("Seleccione plan de estudios: ", FormId.Plan);
		await this.waitForSelect(FormId.Tipologia);
		await this.select("Seleccione tipología: ", FormId.Tipologia);
		if (this.data[FormId.Tipologia] == "7") {
			await this.selectLE();
		}
		if (!this.query) this.query = await Tracker.rl.question("Ingrese el término de búsqueda: ");
		await this.page.type(this.idToSelector(FormId.Nombre), this.query);
		await this.page.waitForSelector(this.idToSelector(FormId.Mostrar) + ":not(.p_AFDisabled)");
		await this.page.click(this.idToSelector(FormId.Mostrar));
		this.log("Buscando... ", false);
		await this.page.waitForSelector(this.idToSelector(FormId.ResultadoDiv), { visible: true });
		this.log("✓\n");
		await this.selectCourse();
	}

	/**
	* Extrae los resultados de la búsqueda
	*
	* @param {FormId} type - Tipo de la tabla
	*/
	static parseTable(type: FormId) {
		let results: Result[] = [];
		const table = document.getElementById(type)?.firstElementChild;
		const tbody = table?.lastElementChild;
		if (tbody?.tagName != "TBODY") {
			throw new Error("No results");
		}
		const rows = tbody?.children;
		for (const [i, row] of Array.from(rows!).entries()) {
			const cols = row.children;
			const a = cols[0].getElementsByTagName("a")[0];
			const span = cols[1].querySelector("[title]")!;
			let result: Result = {
				id: (() => a.id)(),
				index: i,
				code: (() => a.innerHTML)(),
				name: (() => span.innerHTML)()
			}
			results.push(result);
		}
		return results;
	}

	/**
	* En la página de grupos del curso, selecciona uno
	*/
	private async selectGroup() {
		if (this.group) {
			await this.page.waitForNetworkIdle();
			this.status = Status.Ready;
			return;
		}
		let val: string;
		let groups: Group[] = [];
		await this.page.waitForNetworkIdle();
		groups = await this.page.evaluate(() => {
			let groups: Group[] = [];
			let divs = document.querySelectorAll("[id$=pgl7]");
			for (const [i, div] of divs.entries()) {
				let teacherSpan = div.querySelector("[id$=ot8]");
				let group: Group = {
					number: i + 1,
					teacher: (() => teacherSpan ? teacherSpan.innerHTML.trim() : "No informado")(),
					places: (() => Number(div.querySelector("[id$=ot24]")!.innerHTML))()
				}
				groups.push(group);
			}
			return groups;
		});
		if (groups.length == 0) {
			throw new FormError("No se encontraron grupos");
		}
		this.log("Estos fueron los grupos que se encontraron:\n");
		for (const group of groups) {
			this.log(`\t[${group.number}] - ${group.teacher} - Cupos: ${group.places}\n`);
		}
		do {
			val = await Tracker.rl.question(`Seleccione un curso [1-${(groups.length).toString()}]: `);
		} while (val < "1" || val > (groups.length).toString());
		this.group = groups[Number(val) - 1];
		this.status = Status.Ready;
	}

	/**
	* Selecciona el curso a seguir
	*/
	private async selectCourse() {
		let val: string;
		let results: Result[] = [];
		try {
			results = await this.page.evaluate(Tracker.parseTable, FormId.ResultadoTabla);
		} catch (e) {
			throw new FormError("No se encontraron resultados");
		}
		if (this.course) {
			this.course = results[this.course.index];
		} else {
			this.log("Estos son los resultados de la búsqueda:\n");
			for (const [i, result] of results.entries()) {
				this.log(`\t[${i}] - ${result.code} ${result.name}\n`);
			}
			do {
				val = await Tracker.rl.question(`Seleccione un curso [0-${(results.length - 1).toString()}]: `);
			} while (val < "0" || val > (results.length - 1).toString());
			this.course = results[Number(val)];
		}
		await this.page.click(this.idToSelector(this.course.id));
		await this.selectGroup();
	}

	/**
	* Obtiene las opciones de los elementos <select> por id
	* 
	* @param {string} id - El id del elemento
	*/
	private async getSelect(id: string): Promise<SelectOption[]> {
		return this.page.evaluate((id: string) => {
			let select: SelectOption[] = [];
			const element = document.getElementById(id);
			const options = element?.getElementsByTagName("option");
			for (const option of options!) {
				if (option.value == "") {
					continue;
				}
				let opt: SelectOption = { value: option.value, title: option.innerHTML ? option.innerHTML : "Ninguno" }
				select.push(opt);
			}
			return select;
		}, id);
	}

	/**
	* En caso de que el usuario seleccione Libre Elección, llena el formulario.
	*/
	private async selectLE() {
		// #pt1:r1:0:pgBusqueda contiene al siguiente select, debe estar visible
		await this.page.waitForSelector("#pt1\\:r1\\:0\\:pgBusqueda", { visible: true });
		await this.select("¿Por qué desea buscar?:", FormId.DeseasBuscar);
		if (this.data[FormId.DeseasBuscar] == "0") {
			await this.selectFyP();
		}
		await this.page.waitForSelector(this.idToSelector(FormId.PlanLE) + ":not([disabled])");
		await this.select("¿Por qué plan?:", FormId.PlanLE);
	}

	/**
	* En caso de que en Libre Elección, el usuario seleccione Facultad y Plan, llena el formulario
	*/
	private async selectFyP() {
		// #pt1:r1:0:pgBusquedaCentro contiene al siguiente select, debe estar visible
		await this.page.waitForSelector("#pt1\\:r1\\:0\\:pgBusquedaCentro", { visible: true })
		await this.select("¿Por qué Sede?:", FormId.SedeLE);
		await this.waitForSelect(FormId.FacultadLE);
		await this.select("¿Por qué facultad?:", FormId.FacultadLE);
	}

	/**
	* Espera a que las opciones de etiquetas <select> cambien
	*
	* @param {FormId} type - El tipo de la etiqueta <select>
	*/
	private waitForSelect(type: FormId): Promise<unknown> {
		return this.page.evaluate((type: FormId) => {
			// Crea una promesa que se resolverá cuando MutationObserver registre un cambio en los hijos
			return new Promise((resolve) => {
				const target = document.getElementById(type.replace("::content", ""))?.parentNode;
				const callback = (ml: MutationRecord[], obs: MutationObserver) => {
					for (const mut of ml) {
						resolve(mut);
						obs.disconnect();
					}
				}
				new MutationObserver(callback).observe(target!, { childList: true });
			})
		}, type);
	}

	/**
	* Selecciona una opción en una etiqueta <select>
	*
	* @param {string} prompt - La pregunta que se le hará al usuario en caso de requerirse
	* @param {FormId} type - El tipo de la etiqueta <select>
	*/
	private async select(prompt: string, type: FormId) {
		// Si no tiene los datos ya, los pregunta
		if (!this.data[type]) this.data[type] = await this.askSelect(prompt, await this.getSelect(type));
		await this.page.click(this.idToSelector(type));
		await this.page.select(this.idToSelector(type), this.data[type]);
	}

	/**
	* Pregunta al usuario por una opción de una etiqueta <select>
	*
	* @param {string} prompt - La pregunta que se le hará al usuario
	* @param {SelectOption[]} select - Las opciones de la etiqueta <select>
	*/
	private async askSelect(prompt: string, select: SelectOption[]): Promise<string> {
		if (select.length == 1) {
			return "0";
		}
		let val = "";
		this.log(`${prompt}\n`);
		for (const option of select) {
			this.log(`\t[${option.value}] - ${option.title}\n`);
		}
		do {
			val = await Tracker.rl.question(`Seleccione una opción [0-${(select.length - 1).toString()}]: `);
		} while (val < "0" || val > (select.length - 1).toString());
		return val;
	}

	/**
	* Convierte un id en un selector de CSS
	*
	* @param {string} id - El id a convertir
	*/
	private idToSelector(id: string): string {
		return `#${id.replace(/:/g, "\\:")}`
	}
}
