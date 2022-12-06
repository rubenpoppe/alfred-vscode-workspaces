#!/bin/bash

entries=$(sqlite3 ~/Library/Application\ Support/Code/User/globalStorage/state.vscdb "SELECT value FROM ItemTable WHERE key LIKE 'history.recentlyOpenedPathsList'")

osascript ./run.js "$entries" $1