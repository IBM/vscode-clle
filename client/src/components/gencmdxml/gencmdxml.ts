import { ComponentIdentification, ComponentState, IBMiComponent } from "@halcyontech/vscode-ibmi-types/api/components/component";
import IBMi from '@halcyontech/vscode-ibmi-types/api/IBMi';
import { getComponentRegistry, getInstance, getVSCodeTools } from '../../api/ibmi';
import * as xml2js from "xml2js";
import { getGenCmdXmlClSrc } from './clSource';
import { ExtensionContext } from 'vscode';

export default class GenCmdXml implements IBMiComponent {
	static ID = `GENCMDXML`;
	static PGM_NAME = `GENCMD2`;
	private readonly currentVersion = 1;
	private library: string | undefined;

	getIdentification(): ComponentIdentification {
		return { name: GenCmdXml.ID, version: this.currentVersion };
	}

	static get(): GenCmdXml | undefined {
		const instance = getInstance();
		const connection = instance?.getConnection();
		if (connection) {
			const componentManager = connection.getComponentManager();
			const componentStates = componentManager.getComponentStates();
			const genCmdXmlComponentState = componentStates.find(cs => cs.id.name === GenCmdXml.ID);
			if (genCmdXmlComponentState.state === `Installed` || genCmdXmlComponentState.state === `NeedsUpdate`) {
				const allAvailableComponents = componentManager.getAllAvailableComponents();
				const genCmdXmlComponent = allAvailableComponents.find(ac => ac.getIdentification().name === GenCmdXml.ID) as GenCmdXml;
				if (genCmdXmlComponent) {
					return genCmdXmlComponent;
				}
			}

			// TODO: When the component version is bumped to 2, replace the above code with:
			// return connection?.getComponent<GenCmdXml>(GenCmdXml.ID);
		}
	}

	async getRemoteState(connection: IBMi, installDirectory: string): Promise<ComponentState> {
		const library = this.getLibrary(connection);

		const pgmVersion = await GenCmdXml.getVersionOf(connection, library, GenCmdXml.PGM_NAME);
		if (Number.isNaN(pgmVersion) || pgmVersion < this.currentVersion) {
			return `NeedsUpdate`;
		}

		return `Installed`;
	}

	static registerComponent(context: ExtensionContext) {
		const genCmdXml = new GenCmdXml();
		const componentRegistry = getComponentRegistry();
		componentRegistry?.registerComponent(context, genCmdXml);
	}


	async update(connection: IBMi, installDirectory: string): Promise<ComponentState> {
		const content = connection.getContent();
		const tempLib = this.getLibrary(connection);

		// Create QTOOLS source file (ignore error if it exists)
		const createSourceFile = await connection.runCommand({ command: `CRTSRCPF ${tempLib}/QTOOLS AUT(*ALL)`, noLibList: true })

		// Upload CL source
		const clSource = getGenCmdXmlClSrc();
		const uploadSource = await content.uploadMemberContent(tempLib, `QTOOLS`, GenCmdXml.PGM_NAME, clSource);

		// Create CL program
		const createProgram = await connection.runCommand({
			command: `CRTBNDCL PGM(${tempLib}/${GenCmdXml.PGM_NAME}) SRCFILE(${tempLib}/QTOOLS) DBGVIEW(*SOURCE) TEXT('${this.currentVersion} - CLLE XML Generator for Commands')`,
			noLibList: true
		});
		if (createProgram.code !== 0) {
			return `Error`
		}

		return `Installed`;
	}

	reset?(): void | Promise<void> {
		// This is called when connecting to a new system.
		this.library = undefined;
	}


	async getCLDefinition(objectName: string, library = `*LIBL`): Promise<any | undefined> {
		const genCmdXml = GenCmdXml.get();
		if (genCmdXml) {
			try {
				const instance = getInstance();
				const connection = instance.getConnection();
				if (connection) {
					const content = connection.getContent();
					const tempLib = this.getLibrary(connection);

					const targetCommand = objectName.padEnd(10) + library.padEnd(10);
					const vsCodeTools = getVSCodeTools();
					const targetName = vsCodeTools.makeid();

					const callResult = await connection.runCommand({
						command: `CALL PGM(${tempLib}/${GenCmdXml.PGM_NAME}) PARM('${targetName}' '${targetCommand}')`,
					});
					if (callResult.code === 0) {
						console.log(callResult);

						try {
							const resultingFile = `/tmp/${targetName}`;
							const xml = (await content.downloadStreamfileRaw(resultingFile)).toString();
							connection.sendCommand({ command: `rm -rf ${resultingFile}` });
							const commandData = await xml2js.parseStringPromise(xml);
							return commandData;
						} catch (e) {
							console.log(`Command likely doesn't exist: ${targetCommand}: ${e.message}`);
						}
					}
				}
			} catch (e) {
				console.log(e);
			}
		}
	}

	/**
	 * Returns DSPFFD outfile rows
	 */
	async getFileDefinition(objectName: string, library = `*LIBL`): Promise<any | undefined> {
		const instance = getInstance();
		const connection = instance.getConnection();
		if (connection) {
			const content = connection.getContent();
			const config = connection.getConfig();

			const tempLib = config.tempLibrary;
			const dateStr = Date.now().toString().substr(-6);
			const randomFile = `R${objectName.substring(0, 3)}${dateStr}`.substring(0, 10);
			const fullPath = `${tempLib}/${randomFile}`;

			const outfileRes = await connection.runCommand({
				command: `DSPFFD FILE(${library}/${objectName}) OUTPUT(*OUTFILE) OUTFILE(${fullPath})`,
				environment: `ile`
			});
			console.log(outfileRes);
			const resultCode = outfileRes.code || 0;

			if (resultCode === 0) {
				const data: object[] = await content.getTable(config.tempLibrary, randomFile, randomFile, true);
				console.log(`Temp OUTFILE read. ${data.length} rows.`);
				return data;
			}
		}
	}

	private getLibrary(connection: IBMi) {
		if (!this.library) {
			const config = connection?.getConfig();
			this.library = config?.tempLibrary.toUpperCase() || `ILEDITOR`;
		}

		return this.library;
	}

	static async getVersionOf(connection: IBMi, schema: string, name: string) {
		const [result] = await connection.runSQL(`select cast(TEXT_DESCRIPTION as varchar(200)) TEXT_DESCRIPTION from qsys2.program_info where program_library = '${schema}' and program_name = '${name}'`);
		if (result?.TEXT_DESCRIPTION) {
			const comment = String(result.TEXT_DESCRIPTION);
			const dash = comment.indexOf('-');
			if (dash > -1) {
				return Number(comment.substring(0, dash).trim());
			}
		}

		return -1;
	}
}