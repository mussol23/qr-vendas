import { WebStorage } from './web';
import { MobileSQLiteStorage } from './mobile';
import { Capacitor } from '@capacitor/core';
import type { StorageProvider } from './types';

let provider: StorageProvider | null = null;

export async function getStorage(): Promise<StorageProvider> {
	if (provider) {
		console.log('🔄 Storage: Usando provider existente:', provider.constructor.name);
		return provider;
	}
	
	if (Capacitor?.isNativePlatform?.()) {
		console.log('📱 Storage: Plataforma nativa detectada, tentando SQLite...');
		// Try SQLite with timeout; fallback to WebStorage if it fails
		const sqliteProvider = new MobileSQLiteStorage();
		try {
			await Promise.race([
				sqliteProvider.init(),
				new Promise((_, reject) => setTimeout(() => reject(new Error('sqlite_init_timeout')), 5000)), // Aumentado para 5s
			]);
			provider = sqliteProvider;
			console.log('✅ Storage: SQLite inicializado com sucesso');
		} catch (err) {
			console.error('❌ Storage: SQLite falhou, usando WebStorage:', err);
			provider = new WebStorage();
			await provider.init();
			console.log('⚠️ Storage: Usando WebStorage como fallback (dados não persistem no mobile!)');
			return provider;
		}
	} else {
		console.log('🌐 Storage: Plataforma web, usando WebStorage');
		provider = new WebStorage();
		await provider.init();
		return provider;
	}
	return provider;
}

// Função para resetar o provider (útil após logout)
export function resetStorage(): void {
	console.log('🔄 Storage: Resetando provider');
	provider = null;
}


