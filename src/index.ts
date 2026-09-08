import puppeteer from "puppeteer";
import readline from "readline/promises";
import { Tracker } from "./Tracker"
import notifier from "node-notifier";
import { exec } from "child_process";

const rl = readline.createInterface(process.stdin, process.stdout);

const TRACKER_STATUS_TIMEOUT = 30000;

// Función de notificador para PC
function notifyDesktop(title: string, message: string) {
	notifier.notify({
		title: title,
		message: message,
		sound: true
	})
}

// Función de notificador para Termux
function notifyTermux(title: string, message: string) {
	exec(`termux-notification -t "${title}" -c "${message}" --vibrate 1000 --sound`);
}

(async () => {
	let trackers: Tracker[] = [];
	let timeout: number;
	let isTermux: boolean = false;
	let usrstr: string = "";

	if (process.platform === 'android') {
        try {
            const fs = require('fs');
            // Check for Termux-specific directory
            isTermux = fs.existsSync('/data/data/com.termux/files/usr');
        } catch (error) {
            isTermux = false;
        }
    }

	if (isTermux) {
		Tracker.browser = await puppeteer.launch({ browser: "firefox", headless: true, args: ["--no-sandbox", "--disable-gpu"] });
		Tracker.notify = notifyTermux;
	} else {
		Tracker.browser = await puppeteer.launch({ browser: "firefox", headless: true });
		Tracker.notify = notifyDesktop;
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
			console.log(`\t${i} - ${course.code} ${course.name} - Grupo ${group.number}: ${group.teacher} - Cupos: ${group.places}\n`);
		}
	} while ((await rl.question("¿Desea seguir otro curso? [S/N]: ")).toLowerCase() == "s");
	do {
		usrstr = await rl.question("¿Con qué frecuencia en segundos desea consultar los cupos? [30 - 180]: ");
	} while (isNaN(parseInt(usrstr)) || parseInt(usrstr) > 180 || parseInt(usrstr) < 30);
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
			console.log(`\t${i} - ${course.code} ${course.name} - Grupo ${group.number}: ${group.teacher} - Cupos: ${group.places} - Tracker: ${status}\n`)
		}
		await new Promise(r => setTimeout(r, TRACKER_STATUS_TIMEOUT));
	}
})();
