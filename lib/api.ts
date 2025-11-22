export const API_URL = import.meta.env.VITE_API_URL as string | undefined;

// Log da API_URL ao carregar o módulo (diagnóstico)
console.log('🔧 API Configuration:');
console.log('  - VITE_API_URL:', API_URL || '❌ NÃO CONFIGURADO');
console.log('  - import.meta.env:', import.meta.env);
if (!API_URL) {
	console.error('❌ ATENÇÃO: VITE_API_URL não está configurado!');
	console.error('❌ Configure o .env e faça: npm run build && npx cap sync');
}

export async function apiPost<T = any>(path: string, body: any, token?: string): Promise<T> {
	const base = API_URL?.replace(/\/+$/, '');
	if (!base) {
		console.error('❌ apiPost: API_URL não configurada');
		console.error('❌ Crie arquivo .env com VITE_API_URL=https://sua-api.onrender.com');
		console.error('❌ Depois faça: npm run build && npx cap sync');
		throw new Error('API URL não configurada (VITE_API_URL).');
	}
	const url = `${base}${path}`;
	const res = await fetch(url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			...(token ? { Authorization: `Bearer ${token}` } : {})
		},
		body: JSON.stringify(body),
	});
	if (!res.ok) {
		throw new Error(`HTTP ${res.status}`);
	}
	return res.json() as Promise<T>;
}


