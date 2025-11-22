// context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Session, User, RealtimeChannel } from '@supabase/supabase-js';
import { apiPost } from '../lib/api';
import { getStorage, resetStorage } from '../storage';

type AuthContextType = {
	user: User | null;
	session: Session | null;
	signInWithPassword: (params: { email?: string; phone?: string; password: string }) => Promise<{ error?: string }>;
	signOut: () => Promise<void>;
	loading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
	const [session, setSession] = useState<Session | null>(null);
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);
	const [presenceChannel, setPresenceChannel] = useState<RealtimeChannel | null>(null);

	const ensureProfile = async (newSession: Session | null) => {
		try {
			if (!newSession?.user) return;
			const full_name = (newSession.user.user_metadata as any)?.full_name ?? null;
			const phone = (newSession.user.user_metadata as any)?.phone ?? null;
			await apiPost('/user/bootstrap', { full_name, phone }, newSession.access_token);
		} catch {
			// ignore bootstrap errors
		}
	};

	const updateUserPresence = useCallback(async (status: 'online' | 'offline', userId?: string) => {
		const currentUserId = userId || user?.id;
		if (!currentUserId) return;

		// Para 'offline', não precisamos do establishment_id
		if (status === 'offline') {
			await supabase.from('user_presence').upsert({
				user_id: currentUserId,
				status: 'offline',
				last_seen: new Date().toISOString(),
			});
			return;
		}

		// Para 'online', buscamos o establishment_id do perfil
		const { data: profile } = await supabase
			.from('profiles')
			.select('establishment_id')
			.eq('user_id', currentUserId)
			.single();

		await supabase.from('user_presence').upsert({
			user_id: currentUserId,
			status: 'online',
			last_seen: new Date().toISOString(),
			establishment_id: profile?.establishment_id || null,
		});
	}, [user?.id]);


	useEffect(() => {
		let isMounted = true;
		supabase.auth.getSession().then(({ data: { session } }) => {
			if (!isMounted) return;
			setSession(session);
			setUser(session?.user ?? null);
			ensureProfile(session);
			setLoading(false);
		});
		const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
			setSession(newSession);
			setUser(newSession?.user ?? null);
			ensureProfile(newSession);
		});
		return () => {
			isMounted = false;
			sub.subscription.unsubscribe();
		};
	}, []);

	// Efeito para gerenciar a presença em tempo real
	useEffect(() => {
		if (user && !presenceChannel) {
			const channel = supabase.channel(`online-users:${user.id}`, {
				config: {
					presence: {
						key: user.id,
					},
				},
			});

			channel.on('presence', { event: 'sync' }, () => {
				// Pode ser usado no futuro para ver quem mais está online
			});

			channel.subscribe(async (status) => {
				if (status === 'SUBSCRIBED') {
					await updateUserPresence('online');
					await channel.track({ user_id: user.id, online_at: new Date().toISOString() });
				}
			});

			setPresenceChannel(channel);

		} else if (!user && presenceChannel) {
			presenceChannel.untrack();
			supabase.removeChannel(presenceChannel);
			setPresenceChannel(null);
		}

		// Cleanup ao desmontar o componente principal
		return () => {
			if (presenceChannel) {
				presenceChannel.untrack();
				supabase.removeChannel(presenceChannel);
			}
		};
	}, [user, presenceChannel, updateUserPresence]);


	const signInWithPassword: AuthContextType['signInWithPassword'] = async ({ email, phone, password }) => {
		let errorText: string | undefined;
		if (email) {
			const { error } = await supabase.auth.signInWithPassword({ email, password });
			errorText = error?.message;
		} else if (phone) {
			const { error } = await supabase.auth.signInWithPassword({ phone, password });
			errorText = error?.message;
		} else {
			errorText = 'Informe email ou telefone';
		}
		return { error: errorText };
	};

	const signOut = async () => {
		const userId = user?.id; // Captura o ID antes de deslogar

		try {
			console.log('🚪 AuthContext: Iniciando logout e limpeza de dados...');

			// 1. Atualiza o status para offline no banco de dados
			if (userId) {
				await updateUserPresence('offline', userId);
				console.log('✅ AuthContext: Status de presença atualizado para offline');
			}

			// 2. Desconecta do canal de presença
			if (presenceChannel) {
				await presenceChannel.untrack();
				await supabase.removeChannel(presenceChannel);
				setPresenceChannel(null);
				console.log('✅ AuthContext: Canal de presença removido');
			}

			// 3. Limpar todos os dados armazenados localmente
			const storage = await getStorage();
			await storage.clearAll();
			console.log('✅ AuthContext: Dados locais limpos');

			// 4. Resetar o provider
			resetStorage();
			console.log('✅ AuthContext: Provider resetado');

			// 5. Fazer logout no Supabase (isso vai disparar o onAuthStateChange)
			await supabase.auth.signOut();
			console.log('✅ AuthContext: Logout completo');

		} catch (error) {
			console.error('❌ AuthContext: Erro durante logout:', error);
			await supabase.auth.signOut(); // Tenta fazer logout mesmo em caso de erro
		}
	};

	const value = useMemo<AuthContextType>(
		() => ({ user, session, signInWithPassword, signOut, loading }),
		[user, session, loading]
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
	const ctx = useContext(AuthContext);
	if (!ctx) throw new Error('useAuth must be used within AuthProvider');
	return ctx;
};