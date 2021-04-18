const vscode = require('vscode');
const fs = require('fs')

function activate(context) {

	let disposable = vscode.commands.registerCommand('autoStuff.autoImport', () => {
		const filePath = vscode.window.activeTextEditor?.document.uri.fsPath
		if (filePath) {
			//vscode.commands.executeCommand('workbench.action.files.save');
			const file = fs.readFileSync(filePath, { encoding: 'utf-8' })
			const lines = file.split('\n')

			let rComps = ['useState', 'useEffect', 'useRef', 'useMemo', 'useLayoutEffect', 'useContext', 'useReducer', 'useImperativeHandle', 'useCallback', 'useDebugValue']
			let rAlreadyImported = []
			let rCompsToImport = []
			let rImpLine = -1;

			let rnComps = ['View', 'Text', 'TouchableOpacity', 'StyleSheet', 'TextInput', 'Image', 'ScrollView', 'Flatlist', 'Switch', 'Keyboard', 'StatusBar', 'Button',]
			let rnAlreadyImported = []
			let rnCompsToImport = []
			let rnImpLine = -1;

			for (let i = 0; i < lines.length; i++) {
				const line = lines[i];
				if (rImpLine > -1 && rnImpLine > -1) break
				if (line.match(/import\s{.*}\sfrom\s(("|')react-native("|'))/gi)) {
					rnImpLine = i

					rnAlreadyImported = line.slice(line.indexOf('{') + 1, line.indexOf('}')).replaceAll(' ', '').split(',')
					rnComps = rnComps.filter(x => !rnAlreadyImported.includes(x))
				} else if (line.match(/import React.*\sfrom ("|')react("|')/gi)) {
					rImpLine = i
					if (line.match(/{.*}/gim)) {
						rAlreadyImported = line.slice(line.indexOf('{') + 1, line.indexOf('}')).replaceAll(' ', '').split(',')
						rComps = rComps.filter(x => !rAlreadyImported.includes(x))
					}
				}
			}

			for (let j = 0; j < rnComps.length; j++) {
				const comp = rnComps[j];
				if (file.includes(comp)) {
					rnCompsToImport.push(comp)
				}
			}

			for (let j = 0; j < rComps.length; j++) {
				const comp = rComps[j];
				if (file.includes(comp)) {
					rCompsToImport.push(comp)
				}
			}

			const rToImportAll = [...rAlreadyImported, ...rCompsToImport]
			const rImportLine = rToImportAll.length == 0 ?
				`import React from 'react'`
				:
				`import React, { ${[...rAlreadyImported, ...rCompsToImport].filter(x => x != '').join(', ')} } from 'react'`

			if (rImpLine > -1) {
				lines[rImpLine] = rImportLine
			} else {
				lines.splice(0, 0, rImportLine)
			}

			const rnImportLine = `import { ${[...rnAlreadyImported, ...rnCompsToImport].filter(x => x != '').join(', ')} } from 'react-native'`

			if (rnImpLine > -1) {
				lines[rnImpLine] = rnImportLine
			} else {
				lines.splice(1, 0, rnImportLine)
			}

			fs.writeFileSync(filePath, lines.join('\n'))

		}

	})

	let autoStyles = vscode.commands.registerCommand('autoStuff.autoStyles', () => {
		const filePath = vscode.window.activeTextEditor?.document.uri.fsPath
		if (filePath) {
			let file = fs.readFileSync(filePath, { encoding: 'utf-8' })
			const stylesFound = file.match(/styles\.[a-zA-Z]*/g).map(x => x.replace('styles.', ''))
			let styleSheet = file.match(/const styles = StyleSheet\.create\(\{[\s\S]*\}\)/gm)[0]
			const stylesUsed = styleSheet.match(/.*:[^[]\{/g).map(x => x.slice(0, x.indexOf(':')).trim())
			const stylesToAdd = [...new Set(stylesFound.filter(x => !stylesUsed.includes(x)))]
			if (stylesToAdd.length != 0) {
				const lines = styleSheet.split('\n')
				for (let i = 0; i < stylesToAdd.length; i++) {
					const style = stylesToAdd[i];
					lines.splice(-1, 0, `\t${style}: {`)
					lines.splice(-1, 0, `\t\t`)
					lines.splice(-1, 0, `\t},`)
				}
				styleSheet = lines.join('\n')
				file = file.replace(/const styles = StyleSheet\.create\(\{[\s\S]*\}\)/gm, styleSheet)
				fs.writeFileSync(filePath, file)
			}
		}
	})

	context.subscriptions.push(disposable);
	context.subscriptions.push(autoStyles);
}

function deactivate() { }

module.exports = {
	activate,
	deactivate
}
