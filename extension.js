const vscode = require('vscode');
const fs = require('fs')

function activate(context) {

	let autoImport = vscode.commands.registerCommand('autoStuff.autoImport', () => {
		const filePath = vscode.window.activeTextEditor?.document.uri.fsPath
		if (filePath) {
			const file = fs.readFileSync(filePath, { encoding: 'utf-8' })
			const lines = file.split('\n')

			let rComps = ['useState', 'useEffect', 'useRef', 'useMemo', 'useLayoutEffect', 'useContext', 'useReducer', 'useImperativeHandle', 'useCallback', 'useDebugValue']
			let rAlreadyImported = []
			let rCompsToImport = []
			let rImpLine = -1;

			let rnComps = ['View', 'Text', 'Pressable', 'TouchableOpacity', 'StyleSheet', 'TextInput', 'Image', 'ScrollView', 'Flatlist', 'Switch', 'Keyboard', 'StatusBar', 'Button',]
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
			const arrRegex = /\[[\s\S]*?]/gm
			const styleSheetRegex = /const styles = StyleSheet\.create\(\{[\s\S]*?\}\)/gm

			const file = fs.readFileSync(filePath, { encoding: 'utf-8' })
			// styles used in the file in the form of styles.nameOfStyle
			const stylesFound = [...new Set(file.match(/styles\.[a-zA-Z]*/g).map(x => x.replace('styles.', '')))]
			// the entire const styles = StyleSheet object
			let styleSheet = file.match(styleSheetRegex)[0]

			// array of styles that include []s
			const replacedArrs = styleSheet.match(arrRegex) || []
			console.log(replacedArrs)
			//replace the arrays with placeholders
			replacedArrs.forEach((arrStr, i) => styleSheet = styleSheet.replace(arrStr, `$arrReplace${i}$`))
			const objString = '{' + styleSheet
				.slice(styleSheet.indexOf('const styles = StyleSheet.create({') + 34, -2)
				.replace(/"/g, "'")
				.replace(/({[\s\S]*?})/g, '`$1`')
				.slice(1)
				+ '}'

			let styleObjUnsorted
			eval('styleObjUnsorted = ' + objString)

			// add styles not already in the stylesheet
			const stylesUsed = Object.keys(styleObjUnsorted)
			const stylesToAdd = [...new Set(stylesFound.filter(x => !stylesUsed.includes(x)))]
			stylesToAdd.forEach(styleKey => styleObjUnsorted[styleKey] = '{\n\t\n\t}')

			// put the stylesheet styles in order of use in the file
			const order = [...stylesFound, ...new Set((stylesUsed.filter(x => !stylesFound.includes(x))))]
			const styleObj = {}
			order.forEach(styleKey => styleObj[styleKey] = styleObjUnsorted[styleKey])

			let newStyles = JSON.stringify(styleObj, null, 2).replace(/"/g, '').replace(/\\n/g, '\r\n').replace(/\\t/g, '\t')
			// replace the placeholders with the arrays
			replacedArrs.forEach((arrStr, i) => newStyles = newStyles.replace(`$arrReplace${i}$`, arrStr))
			newStyles = 'const styles = StyleSheet.create(' + newStyles + ')'
			const newFile = file.replace(styleSheetRegex, newStyles)

			fs.writeFileSync(filePath, newFile)
			// */
		}
	})

	context.subscriptions.push(autoImport)
	context.subscriptions.push(autoStyles)
}

function deactivate() { }

module.exports = {
	activate,
	deactivate
}
