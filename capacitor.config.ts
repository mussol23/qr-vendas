import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
	appId: 'com.qr.vendas',
	appName: 'QR Vendas',
	webDir: 'dist',
	bundledWebRuntime: false,
	server: {
		androidScheme: 'https',
	},
	plugins: {
		CapacitorSQLite: {
			iosDatabaseLocation: 'Library/CapacitorDatabase',
			iosIsEncryption: false,
			androidIsEncryption: false,
		},
		// ML Kit plugin does not require specific config here
	},
};

export default config;


