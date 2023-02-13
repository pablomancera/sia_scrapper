import puppeteer from "puppeteer";
import readline from "readline/promises";
import { Status, Tracker } from "./Tracker.js"
import notifier from "node-notifier";
import { exec } from "child_process";

const rl = readline.createInterface(process.stdin, process.stdout);

const TRACKER_STATUS_TIMEOUT = 30000;

// Función de notificador para PC
function notifyDesktop(title: string, message: string) {
	notifier.notify({
		title: title,
		message: message
	})
}

// Función de notificador para Termux
function notifyTermux(title: string, message: string) {
	exec(`termux-notification -t "${title}" -c "${message}"`);
}

(async () => {
	let trackers: Tracker[] = [];
	let timeout: number;
	let usrstr: string = "";
	do {
		console.log("\t[0] - Escritorio (Windows, Linux, MacOS, etc...)\n");
		console.log("\t[1] - Android (Termux)\n");
		usrstr = await rl.question("¿Qué plataforma está utilizando?: ");
	} while (usrstr != "0" && usrstr != "1");
	switch (usrstr) {
		case "0":
			Tracker.browser = await puppeteer.launch({ headless: true });
			Tracker.notify = notifyDesktop;
			break;
		case "1":
			Tracker.browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox", "--disable-gpu"] });
			Tracker.notify = notifyTermux;
			break;
	}
	Tracker.rl = rl;
	// Inicializa los trackers
	do {
		let tracker = new Tracker(await Tracker.browser.newPage());
		await tracker.init();
		trackers.push(tracker);
		console.log(`Tracker para ${tracker.getCourse()?.name} con ${tracker.getGroup()?.teacher} inicializado`);
		console.log("Esta es la lista de cursos a seguir hasta el momento:\n");
		for (const [i, tracker] of trackers.entries()) {
			const course = tracker.getCourse()!;
			const group = tracker.getGroup()!;
			console.log(`\t${i} - ${course.name} - ${group.teacher} - Cupos: ${group.places}\n`);
		}
	} while ((await rl.question("¿Desea seguir otro curso? [S/N]: ")).toLowerCase() == "s");
	do {
		usrstr = await rl.question("¿Con qué frecuencia en segundos desea consultar los cupos? [30 - 180]: ");

	} while (usrstr <= "180" && usrstr >= "30");
	timeout = Number(usrstr) * 1000;
	// Inicia los trackers
	for (const tracker of trackers) {
		tracker.track(timeout);
	}
	// Actualiza el estado de los trackers
	while (true) {
		console.log("=".repeat(50));
		console.log("\nEstado de los cursos:\n");
		for (const [i, tracker] of trackers.entries()) {
			const course = tracker.getCourse()!;
			const group = tracker.getGroup()!;
			const status = tracker.getStatus();
			console.log(`\t${i} - ${course.name} - ${group.teacher} - Cupos: ${group.places} - Tracker: ${status}\n`)
		}
		await new Promise(r => setTimeout(r, TRACKER_STATUS_TIMEOUT));
	}
})();
