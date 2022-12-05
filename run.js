const localWorkspace = new RegExp("^file://(.+)$");
const remoteSSHWorkspace = new RegExp("^vscode-remote://ssh-remote+(.+?(?=/))(.+)$");
const remoteWSLWorkspace = new RegExp("^vscode-remote://wsl+(.+?(?=/))(.+)$");
const codespacesWorkspace = new RegExp("^vscode-remote://vsonline+(.+?(?=/))(.+)$");
const devContainerWorkspace = new RegExp("^vscode-remote://dev-container+(.+?(?=/))(.+)$");

function run(argv) {
	const { entries } = JSON.parse(argv[0]);
	const query = argv[1] || "";

	console.log(query);

	const items = convertEntriesToWorkspaces(entries)
		.map((w) => convertWorkspaceToItem(w, query))
		.sort((w1, w2) => w2.score - w1.score)
		.slice(0, 4);

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

	return {
		title: title,
		subtitle: subtitle,
		arg: `${w.isWorkspaceFile || w.env !== "Local" ? `${w.path},--file-uri` : `${w.relativePath},--folder-uri`}`,
		score: calculateScore(w, query),
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

function calculateScore(workspace, query) {
	const intersection = intersect(workspace.folderName.toLowerCase(), query.toLowerCase()).length * query.length;
	const differenceWithQuery = (workspace.folderName.length - intersection) * query.length * 0.7;

	return 100 - differenceWithQuery + intersection;
}

function intersect(a, b) {
	return [...new Set(a)].filter((x) => new Set(b).has(x));
}
