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
		// Configuração para deep links OAuth
		App: {
			appUrlScheme: 'com.qr.vendas',
		},
	},
};

export default config;


