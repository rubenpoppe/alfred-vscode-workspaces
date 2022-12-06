# Alfred VS Code Workspaces

Open VS Code workspace like a champ. No depencies, MacOS implementation of [PowerToys](https://github.com/microsoft/PowerToys) Run ([source code](https://github.com/microsoft/PowerToys/tree/main/src/modules/launcher/Plugins/Community.PowerToys.Run.Plugin.VSCodeWorkspaces)). Supports local and SSH workspaces, Dev Containers and Codespaces.

Uses code from [js-levenshtein](https://github.com/gustf/js-levenshtein) for string matching.

## Usage

Type `code` with a potential query. When a query is provided workspace are filtered, otherwise most recently used workspaces are listed.
Hold ⌥ to open workspace location in Finder (only works with local workspaces).
