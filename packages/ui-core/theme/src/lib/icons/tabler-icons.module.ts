import { NgModule } from '@angular/core';
import { NbIconLibraries } from '@nebular/theme';
import { evaToTablerIcons } from './eva-to-tabler-icons.map';

@NgModule()
export class NbTablerIconsModule {
	constructor(private iconLibraries: NbIconLibraries) {
		this.registerTablerPack();
	}

	registerTablerPack() {
		// We register this pack as 'eva' to maintain backward compatibility with existing usages of the Eva icon pack in templates and configuration.
		this.iconLibraries.registerSvgPack('eva', evaToTablerIcons);
		this.iconLibraries.setDefaultPack('eva');
	}
}
