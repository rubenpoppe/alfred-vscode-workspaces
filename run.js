const localWorkspace = new RegExp("^file://(.+)$");
const remoteSSHWorkspace = new RegExp("^vscode-remote://ssh-remote+(.+?(?=/))(.+)$");
const remoteWSLWorkspace = new RegExp("^vscode-remote://wsl+(.+?(?=/))(.+)$");
const codespacesWorkspace = new RegExp("^vscode-remote://vsonline+(.+?(?=/))(.+)$");
const devContainerWorkspace = new RegExp("^vscode-remote://dev-container+(.+?(?=/))(.+)$");

function run(argv) {
	const { entries } = JSON.parse(argv[0]);
	const query = argv[1] || "";

	const items = convertEntriesToWorkspaces(entries)
		.map((w) => convertWorkspaceToItem(w, query))
		.sort((i1, i2) => i2.score - i1.score)
		.slice(0, 5);

	return JSON.stringify({ items: items });
}

function convertWorkspaceToItem(w, query) {
	let title = w.folderName.replace(".code-workspace", ` (${w.env})`);
	let subtitle = w.isWorkspaceFile ? "Workspace" : "Project Folder";

	if (w.env !== "Local") {
		title += `${w.extraInfo ? ` - ${w.extraInfo}` : ""} (${w.env})`;
		subtitle += ` in ${w.env}`;
	}

	subtitle += `: ${w.relativePath}`;

	let score;
	if (query !== "") {
		const strippedTitle = title.replace(/[()]/g, "").toLowerCase();
		score = (strippedTitle.length - levenshtein(strippedTitle, query.toLowerCase())) / strippedTitle.length;
	}

	return {
		title: title,
		subtitle: subtitle,
		arg: `${w.isWorkspaceFile || w.env !== "Local" ? `${w.path},--file-uri` : `${w.relativePath},--folder-uri`}`,
		score: score,
		autocomplete: title,
	};
}

function convertEntriesToWorkspaces(entries) {
	return entries
		.filter((entry) => entry.folderUri)
		.map((entry) => {
			let isWorkspaceFile = false;
			let uri = entry.folderUri;

			if (entry.workspace && entry.workspace.configPath) {
				isWorkspaceFile = true;
				uri = entry.workspace.configPath;
			}

			const { type, machineName, path } = getWorkspaceEnvironment(uri);

			let folderName = path.split("/");

			return {
				path: uri,
				isWorkspaceFile: isWorkspaceFile,
				relativePath: path,
				folderName: folderName[folderName.length - 1],
				extraInfo: machineName,
				env: type,
			};
		});
}

function getWorkspaceEnvironment(uri) {
	let match;
	switch (true) {
		case localWorkspace.test(uri):
			match = localWorkspace.exec(uri);
			return { type: "Local", machineName: undefined, path: match[1] };
		case remoteSSHWorkspace.test(uri):
			match = remoteSSHWorkspace.exec(uri);
			return { type: "SSH", machineName: match[1], path: match[2] };
		case codespacesWorkspace.test(uri):
			match = codespacesWorkspace.exec(uri);
			return { type: "Codespace", undefined, path: match[2] };
		case devContainerWorkspace.test(uri):
			match = devContainerWorkspace.exec(uri);
			return { type: "Dev Container", undefined, path: match[2] };
		default:
			return;
	}
}

function intersect(a, b) {
	return [...new Set(a)].filter((x) => new Set(b).has(x));
}

function _min(d0, d1, d2, bx, ay) {
	return d0 < d1 || d2 < d1 ? (d0 > d2 ? d2 + 1 : d0 + 1) : bx === ay ? d1 : d1 + 1;
}

function levenshtein(a, b) {
	if (a === b) {
		return 0;
	}

	if (a.length > b.length) {
		let tmp = a;
		a = b;
		b = tmp;
	}

	let la = a.length;
	let lb = b.length;

	while (la > 0 && a.charCodeAt(la - 1) === b.charCodeAt(lb - 1)) {
		la--;
		lb--;
	}

	let offset = 0;

	while (offset < la && a.charCodeAt(offset) === b.charCodeAt(offset)) {
		offset++;
	}

	la -= offset;
	lb -= offset;

	if (la === 0 || lb < 3) {
		return lb;
	}

	let x = 0;
	let y;
	let d0;
	let d1;
	let d2;
	let d3;
	let dd;
	let dy;
	let ay;
	let bx0;
	let bx1;
	let bx2;
	let bx3;

	let vector = [];

	for (y = 0; y < la; y++) {
		vector.push(y + 1);
		vector.push(a.charCodeAt(offset + y));
	}

	let len = vector.length - 1;

	for (; x < lb - 3; ) {
		bx0 = b.charCodeAt(offset + (d0 = x));
		bx1 = b.charCodeAt(offset + (d1 = x + 1));
		bx2 = b.charCodeAt(offset + (d2 = x + 2));
		bx3 = b.charCodeAt(offset + (d3 = x + 3));
		dd = x += 4;
		for (y = 0; y < len; y += 2) {
			dy = vector[y];
			ay = vector[y + 1];
			d0 = _min(dy, d0, d1, bx0, ay);
			d1 = _min(d0, d1, d2, bx1, ay);
			d2 = _min(d1, d2, d3, bx2, ay);
			dd = _min(d2, d3, dd, bx3, ay);
			vector[y] = dd;
			d3 = d2;
			d2 = d1;
			d1 = d0;
			d0 = dy;
		}
	}

	for (; x < lb; ) {
		bx0 = b.charCodeAt(offset + (d0 = x));
		dd = ++x;
		for (y = 0; y < len; y += 2) {
			dy = vector[y];
			vector[y] = dd = _min(dy, d0, dd, bx0, vector[y + 1]);
			d0 = dy;
		}
	}

	return dd;
}
