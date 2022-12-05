#!/bin/bash

entries=$(sqlite3 ~/Library/Application\ Support/Code/User/globalStorage/state.vscdb "SELECT value FROM ItemTable WHERE key LIKE 'history.recentlyOpenedPathsList'")

echo $1

osascript ./run.js "$entries" $1