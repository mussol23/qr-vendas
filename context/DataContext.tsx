
import React, { createContext, useContext, useState, PropsWithChildren, useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import type { PluginListenerHandle } from '@capacitor/core';
import { Network } from '@capacitor/network';
import { Product, CartItem, Sale, Client, FinancialTransaction, DataContextType } from '../types';
import { getStorage } from '../storage';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';
import { apiPost } from '../lib/api';
import { addPendingDelete, getPendingDeletes, removePendingDelete } from '../lib/offlineQueue';
import { useToast } from './ToastContext';

const DataContext = createContext<DataContextType | undefined>(undefined);

// 🏢 Helper para obter establishment_id do usuário logado
async function getUserEstablishmentId(): Promise<string | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      console.log('⚠️ getUserEstablishmentId: Sem sessão');
      return null;
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('establishment_id')
      .eq('user_id', session.user.id)
      .maybeSingle();

    if (error) {
      console.error('❌ getUserEstablishmentId: Erro ao buscar profile:', error);
      return null;
    }

    if (!profile?.establishment_id) {
      console.warn('⚠️ getUserEstablishmentId: Profile sem establishment_id');
      return null;
    }

    console.log('✅ getUserEstablishmentId:', profile.establishment_id);
    return profile.establishment_id;
  } catch (error) {
    console.error('❌ getUserEstablishmentId: Exceção:', error);
    return null;
  }
}

const generateUuid = () => {
  if ('randomUUID' in crypto) {
    return (crypto as any).randomUUID();
  }
  // Fallback (not RFC4122 strict, but unique enough offline)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};


export const DataProvider = ({ children }: PropsWithChildren<{}>) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [loaded, setLoaded] = useState(false);
  const { user } = useAuth();
  const { showToast } = useToast();
  const isPushingRef = useRef(false);
  const prevUserRef = useRef(user);
  const isFirstRender = useRef(true);



  useEffect(() => {
    const handleOnline = () => {
      console.log('📶 Browser: online');
      setIsOnline(true);
    };
    const handleOffline = () => {
      console.log('📶 Browser: offline');
      setIsOnline(false);
    };

    let networkListener: PluginListenerHandle | undefined;

    const setupNetworkListener = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          const status = await Network.getStatus();
          console.log('📡 Network inicial (Capacitor):', status);
          setIsOnline(status.connected);
          networkListener = await Network.addListener('networkStatusChange', (status) => {
            console.log('📡 Network status change:', status);
            setIsOnline(status.connected);
          });
        } catch (error) {
          console.warn('⚠️ Falha ao inicializar Network plugin:', error);
        }
      } else {
        setIsOnline(navigator.onLine);
      }
    };

    setupNetworkListener();

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      networkListener?.remove();
    };
  }, []);

  // Quando voltar a ficar online, tenta enviar push pendente
  useEffect(() => {
    if (isOnline) {
      console.log('📶 DataContext: dispositivo online, verificando push pendente...');
      doPushInBackground('network-online');
    }
  }, [isOnline]);



  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        console.log('🔄 DataContext: Carregando dados do storage...');
        const storage = await getStorage();
        console.log('✅ DataContext: Storage obtido:', storage.constructor.name);

        const [prods, cls, s, txs] = await Promise.all([
          storage.getProducts().catch((err) => { console.error('Erro ao carregar produtos:', err); return []; }),
          storage.getClients().catch((err) => { console.error('Erro ao carregar clientes:', err); return []; }),
          storage.getSales().catch((err) => { console.error('Erro ao carregar vendas:', err); return []; }),
          storage.getTransactions().catch((err) => { console.error('Erro ao carregar transações:', err); return []; }),
        ]);

        if (!mounted) return;

        console.log('📦 Dados carregados do storage:', {
          products: prods.length,
          clients: cls.length,
          sales: s.length,
          transactions: txs.length
        });

        setProducts(prods);
        setClients(cls);
        setSales(s);
        setTransactions(txs);
      } catch (e) {
        console.error('❌ DataContext: Erro ao carregar storage:', e);
        if (!mounted) return;
      } finally {
        if (mounted) {
          console.log('✅ DataContext: Dados carregados, setLoaded(true)');
          setLoaded(true);
        }
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Função helper para fazer push em background
  const doPushInBackground = (reason: string = 'auto') => {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🔔 [${timestamp}] doPushInBackground CHAMADO (${reason})`);
    console.log(`  📊 Status atual:`);
    console.log(`    - isOnline: ${isOnline}`);
    console.log(`    - isPushing: ${isPushingRef.current}`);
    console.log(`    - user: ${user?.email || 'nenhum'}`);
    console.log(`    - user.id: ${user?.id || 'nenhum'}`);
    console.log(`${'='.repeat(60)}\n`);

    // Aumentado timeout para 500ms para garantir que o storage terminou de salvar
    setTimeout(async () => {
      if (isPushingRef.current) {
        console.log(`⏳ [${timestamp}] DataContext: Push já em andamento, ignorando (${reason})`);
        return;
      }
      if (!isOnline) {
        console.log(`📴 [${timestamp}] DataContext: Offline detectado, push adiado até voltar online (${reason})`);
        return;
      }

      isPushingRef.current = true;
      console.log(`🚀 [${timestamp}] DataContext: INICIANDO push background (${reason})...`);

      try {
        const { pushChanges } = await import('../lib/sync');
        console.log(`📤 [${timestamp}] DataContext: Módulo sync importado, chamando pushChanges()...`);

        // 🆕 Processar fila de deleções pendentes (offline queue)
        const pendingDeletes = getPendingDeletes();
        if (pendingDeletes.length > 0) {
          console.log(`🗑️ DataContext: Processando ${pendingDeletes.length} deleções pendentes...`);
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.access_token) {
            for (const item of pendingDeletes) {
              try {
                console.log(`🗑️ DataContext: Deletando pendente ${item.table}/${item.id}...`);
                await apiPost('/sync/delete', { table: item.table, ids: [item.id] }, session.access_token);
                removePendingDelete(item.id, item.table);
                console.log(`✅ DataContext: Deleção pendente resolvida: ${item.id}`);
              } catch (err) {
                console.error(`❌ DataContext: Falha ao processar deleção pendente ${item.id}:`, err);
              }
            }
          }
        }

        // Log antes de chamar
        console.log(`⏰ [${timestamp}] DataContext: Chamando pushChanges() agora...`);
        await pushChanges();
        console.log(`✅ [${timestamp}] DataContext: Push COMPLETO com sucesso (${reason})`);
        console.log(`${'✅'.repeat(30)}\n`);
      } catch (e: any) {
        console.log(`\n${'❌'.repeat(30)}`);
        console.log(`❌ [${timestamp}] DataContext: ERRO CAPTURADO NO PUSH (${reason})`);
        console.log(`❌ Tipo do erro:`, typeof e);
        console.log(`❌ Nome do erro:`, e?.name);
        console.log(`❌ Mensagem:`, e?.message);
        console.log(`❌ Stack trace:`, e?.stack);
        console.log(`❌ Erro completo:`, JSON.stringify(e, null, 2));
        console.log(`${'❌'.repeat(30)}\n`);

        // Se o erro for de API_URL não configurado, avisar mas não quebrar
        if (e?.message?.includes('API_URL')) {
          console.warn(`⚠️ DataContext: Sincronização com servidor não disponível (${reason})`);
          console.warn(`⚠️ DataContext: Dados salvos APENAS LOCALMENTE`);
          console.warn(`⚠️ DataContext: Configure VITE_API_URL para sincronizar com o servidor`);
        } else {
          console.error(`❌ DataContext: ERRO INESPERADO ao fazer push (${reason}):`, e);
          if (reason !== 'auto') {
            showToast('Erro na sincronização de dados.', 'error');
          }
        }
      } finally {
        isPushingRef.current = false;
        console.log(`🔓 [${timestamp}] DataContext: Lock de push liberado (${reason})\n`);
      }
    }, 500); // Aumentado para 500ms para garantir que storage salvou
  };

  const handleSync = (forcePull = false) => {
    if (!isOnline) return;
    setIsSyncing(true);
    (async () => {
      try {
        const { pullChanges, pushChanges } = await import('../lib/sync');
        // Push local changes first (will skip non-UUID ids)
        await pushChanges().catch((err) => {
          console.error('❌ DataContext handleSync: Erro ao fazer push:', err);
        });
        // Only pull if forced (manual sync)
        if (forcePull) {
          // Fazer pull (que faz merge, não substitui)
          await pullChanges().catch(() => { });
          // Recarregar dados do storage (que agora tem dados locais + servidor)
          const storage = await getStorage();
          const [prods, cls, s, txs] = await Promise.all([
            storage.getProducts().catch(() => []),
            storage.getClients().catch(() => []),
            storage.getSales().catch(() => []),
            storage.getTransactions().catch(() => []),
          ]);
          // Atualizar estado mantendo dados locais que não estão no servidor
          setProducts(prev => {
            const merged = new Map();
            // Primeiro adiciona todos os dados locais
            prev.forEach(p => merged.set(p.id, p));
            // Depois atualiza/sobrescreve com dados do storage (que já tem merge)
            prods.forEach(p => merged.set(p.id, p));
            return Array.from(merged.values());
          });
          setClients(prev => {
            const merged = new Map();
            prev.forEach(c => merged.set(c.id, c));
            cls.forEach(c => merged.set(c.id, c));
            return Array.from(merged.values());
          });
          setSales(prev => {
            const merged = new Map();
            prev.forEach(s => merged.set(s.id, s));
            s.forEach(sale => {
              console.log(`🔄 DataContext: Merge venda ${sale.id} com ${sale.items?.length || 0} itens`);
              merged.set(sale.id, sale);
            });
            const result = Array.from(merged.values());
            console.log(`✅ DataContext: ${result.length} vendas após merge`);
            return result;
          });
          setTransactions(prev => {
            const merged = new Map();
            prev.forEach(t => merged.set(t.id, t));
            txs.forEach(t => merged.set(t.id, t));
            return Array.from(merged.values()).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          });
        }
        if (forcePull) {
          showToast('Sincronização concluída com sucesso!', 'success');
        }
      } catch (err) {
        console.error('Erro no syncNow:', err);
        if (forcePull) {
          showToast('Erro ao sincronizar dados.', 'error');
        }
      } finally {
        setIsSyncing(false);
      }
    })();
  };

  const addProduct = (productData: Omit<Product, 'id' | 'qrCode' | 'createdAt' | 'updatedAt'>) => {
    if (isNaN(productData.price) || isNaN(productData.quantity) || isNaN(productData.purchasePrice)) {
      console.error("Attempted to add product with invalid price or quantity.");
      return;
    }
    const newId = generateUuid();
    console.log('➕ DataContext: Adicionando novo produto:', newId, productData.name);
    // Salvar localmente PRIMEIRO, depois fazer push em background (sem pull)
    (async () => {
      try {
        // 🏢 Obter establishment_id do usuário logado
        const establishmentId = await getUserEstablishmentId();
        if (!establishmentId) {
          console.warn('⚠️ DataContext: Produto criado SEM establishment_id (usuário sem estabelecimento)');
        }

        const newProduct: Product = {
          ...productData,
          id: newId,
          qrCode: newId,
          establishmentId: establishmentId ?? undefined, // 🏢 Incluir establishment_id
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const storage = await getStorage();
        console.log('📝 DataContext: Salvando produto no storage:', storage.constructor.name);
        console.log('🏢 DataContext: establishment_id:', establishmentId);

        // AGUARDAR o storage salvar completamente
        await storage.upsertProduct(newProduct);
        console.log('✅ DataContext: Produto salvo no storage');

        // Verificar se realmente foi salvo
        const savedProducts = await storage.getProducts();
        console.log(`🔍 DataContext: Verificação - ${savedProducts.length} produtos no storage`);
        const found = savedProducts.find(p => p.id === newProduct.id);
        if (found) {
          console.log('✅ DataContext: Produto confirmado no storage');
        } else {
          console.error('❌ DataContext: Produto NÃO foi encontrado após salvar!');
        }

        // Atualizar estado React APÓS salvar no storage
        setProducts(prev => [newProduct, ...prev]);
        console.log('✅ DataContext: Produto adicionado ao estado React');

        // Fazer push em background APÓS confirmar salvamento
        doPushInBackground('addProduct');
      } catch (error) {
        console.error('❌ DataContext: Erro ao salvar produto localmente:', error);
        throw error; // Re-throw para não adicionar ao estado se falhou
      }
    })();
  };

  const updateProduct = (updatedProduct: Product) => {
    const next = { ...updatedProduct, updatedAt: new Date().toISOString() };
    (async () => {
      try {
        const storage = await getStorage();
        console.log('📝 DataContext: Atualizando produto no storage:', next.id);
        await storage.upsertProduct(next);
        console.log('✅ DataContext: Produto atualizado no storage');
        setProducts(prev => prev.map(p => p.id === next.id ? next : p));
        // Fazer push em background APÓS salvar
        doPushInBackground('updateProduct');
      } catch (error) {
        console.error('❌ DataContext: Erro ao atualizar produto localmente:', error);
      }
    })();
  };

  const deleteProduct = (productId: string) => {
    console.log('🔍 DEBUG: deleteProduct chamado (versão nova v2)');
    (async () => {
      try {
        const storage = await getStorage();
        console.log('🗑️ DataContext: Deletando produto do storage:', productId);
        await storage.deleteProduct(productId);
        console.log('✅ DataContext: Produto deletado do storage');
        // Remove do estado React
        setProducts(prev => prev.filter(p => p.id !== productId));
        // Se estiver online, remover via API (backend admin) para evitar bloqueio RLS
        if (isOnline) {
          try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.access_token) {
              console.log('🗑️ DataContext: Solicitando deleção no servidor via /sync/delete...');
              await apiPost('/sync/delete', { table: 'products', ids: [productId] }, session.access_token);
              console.log('✅ DataContext: Produto deletado no servidor com sucesso');
            } else {
              throw new Error('Sem sessão ativa');
            }
          } catch (apiError) {
            console.error('❌ DataContext: Erro ao deletar produto via API, adicionando à fila offline:', apiError);
            addPendingDelete({ id: productId, table: 'products' });
          }
        } else {
          console.log('📴 DataContext: Offline, adicionando produto à fila de deleção');
          addPendingDelete({ id: productId, table: 'products' });
        }
        // Fazer push em background APÓS deletar (para garantir sync de outros dados)
        doPushInBackground('deleteProduct');
      } catch (error) {
        console.error('❌ DataContext: Erro ao deletar produto localmente:', error);
      }
    })();
  };

  const addClient = (clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newId = generateUuid();
    console.log('➕ DataContext: Adicionando novo cliente:', newId, clientData.name);
    // Salvar localmente PRIMEIRO, depois sincronizar
    (async () => {
      try {
        // 🏢 Obter establishment_id do usuário logado
        const establishmentId = await getUserEstablishmentId();
        if (!establishmentId) {
          console.warn('⚠️ DataContext: Cliente criado SEM establishment_id (usuário sem estabelecimento)');
        }

        const newClient: Client = {
          ...clientData,
          id: newId,
          establishmentId: establishmentId ?? undefined, // 🏢 Incluir establishment_id
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const storage = await getStorage();
        console.log('📝 DataContext: Salvando cliente no storage:', newClient.id, newClient.name);
        console.log('🏢 DataContext: establishment_id:', establishmentId);
        await storage.upsertClient(newClient);
        console.log('✅ DataContext: Cliente salvo no storage');
        setClients(prev => [newClient, ...prev]);
        // Fazer push em background APÓS salvar
        doPushInBackground('addClient');
      } catch (error) {
        console.error('❌ DataContext: Erro ao salvar cliente localmente:', error);
      }
    })();
    // Retornar cliente temporário sem estabelishment_id para evitar bloqueio
    return { ...clientData, id: newId, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  }

  const updateClient = (updatedClient: Client) => {
    const next = { ...updatedClient, updatedAt: new Date().toISOString() };
    (async () => {
      try {
        const storage = await getStorage();
        console.log('📝 DataContext: Atualizando cliente no storage:', next.id);
        await storage.upsertClient(next);
        console.log('✅ DataContext: Cliente atualizado no storage');
        setClients(prev => prev.map(c => c.id === next.id ? next : c));
        // Fazer push em background APÓS salvar
        doPushInBackground('updateClient');
      } catch (error) {
        console.error('❌ DataContext: Erro ao atualizar cliente localmente:', error);
      }
    })();
  };

  const deleteClient = (clientId: string) => {
    (async () => {
      try {
        const storage = await getStorage();
        console.log('🗑️ DataContext: Deletando cliente do storage:', clientId);
        await storage.deleteClient(clientId);
        console.log('✅ DataContext: Cliente deletado do storage');
        // Remove do estado React
        setClients(prev => prev.filter(c => c.id !== clientId));

        // Se estiver online, remover via API (backend admin) para evitar bloqueio RLS
        if (isOnline) {
          try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.access_token) {
              console.log('🗑️ DataContext: Solicitando deleção no servidor via /sync/delete...');
              await apiPost('/sync/delete', { table: 'clients', ids: [clientId] }, session.access_token);
              console.log('✅ DataContext: Cliente deletado no servidor com sucesso');
            } else {
              throw new Error('Sem sessão ativa');
            }
          } catch (apiError) {
            console.error('❌ DataContext: Erro ao deletar cliente via API, adicionando à fila offline:', apiError);
            addPendingDelete({ id: clientId, table: 'clients' });
          }
        } else {
          console.log('📴 DataContext: Offline, adicionando cliente à fila de deleção');
          addPendingDelete({ id: clientId, table: 'clients' });
        }

        doPushInBackground('deleteClient');
      } catch (error) {
        console.error('❌ DataContext: Erro ao deletar cliente localmente:', error);
      }
    })();
  };

  const updateStock = (productId: string, newQuantity: number) => {
    const nextUpdatedAt = new Date().toISOString();
    (async () => {
      try {
        const prod = products.find(p => p.id === productId);
        if (!prod) return;
        const updated = { ...prod, quantity: newQuantity, updatedAt: nextUpdatedAt };
        const storage = await getStorage();
        console.log('📝 DataContext: Atualizando estoque no storage:', productId, `quantidade: ${newQuantity}`);
        await storage.upsertProduct(updated);
        console.log('✅ DataContext: Estoque atualizado no storage');
        setProducts(prev => prev.map(p => p.id === productId ? updated : p));
        // Fazer push em background APÓS salvar
        doPushInBackground('updateStock');
      } catch (error) {
        console.error('❌ DataContext: Erro ao atualizar estoque localmente:', error);
      }
    })();
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existingItem = prev.find(item => item.product.id === product.id);
      if (existingItem) {
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (isNaN(quantity)) {
      return;
    }

    const product = products.find(p => p.id === productId);
    if (!product) return;

    const effectiveQuantity = Math.max(0, Math.min(quantity, product.quantity));

    if (effectiveQuantity <= 0) {
      removeFromCart(productId);
    } else {
      setCart(prev => prev.map(item => item.product.id === productId ? { ...item, quantity: effectiveQuantity } : item));
    }
  };

  const clearCart = () => {
    setCart([]);
  };

  const processSale = (
    items: { product: Product, quantity: number }[],
    clientId: string | undefined,
    docType: Sale['type'],
    dueDate?: string,
    observations?: string,
    externalReference?: string,
    paymentMethod?: string
  ) => {
    const total = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const profit = items.reduce((sum, item) => sum + (item.product.price - item.product.purchasePrice) * item.quantity, 0);
    const client = clients.find(c => c.id === clientId);

    const uuid = generateUuid();
    let humanNumber = '';
    switch (docType) {
      case 'invoice':
        humanNumber = `FT-${String(sales.filter(s => s.type === 'invoice').length + 1).padStart(4, '0')}`;
        break;
      case 'receipt':
        humanNumber = `RC-${String(sales.filter(s => s.type === 'receipt').length + 1).padStart(4, '0')}`;
        break;
      case 'invoice-receipt':
        humanNumber = `FR-${String(sales.filter(s => s.type === 'invoice-receipt').length + 1).padStart(4, '0')}`;
        break;
    }

    console.log('🛒 DataContext: Processando venda:', uuid, docType, humanNumber);

    // Salvar venda e atualizar estoque localmente PRIMEIRO
    (async () => {
      try {
        // 🏢 Obter establishment_id do usuário logado
        const establishmentId = await getUserEstablishmentId();
        if (!establishmentId) {
          console.warn('⚠️ DataContext: Venda criada SEM establishment_id (usuário sem estabelecimento)');
        }

        const newSale: Sale = {
          id: uuid,
          number: humanNumber,
          date: new Date().toISOString(),
          dueDate,
          total,
          profit,
          type: docType,
          establishmentId: establishmentId ?? undefined, // 🏢 Incluir establishment_id
          clientId: client?.id,
          clientName: client?.name,
          items: items.map(item => ({
            id: generateUuid(), // Gerar ID único para cada item desde a criação
            productId: item.product.id,
            productName: item.product.name,
            quantity: item.quantity,
            price: item.product.price,
            purchasePrice: item.product.purchasePrice,
          })),
          observations,
          externalReference,
          paymentMethod,
          status: docType === 'receipt' ? 'paid' : 'pending',
        };

        const storage = await getStorage();

        console.log('📝 DataContext: Salvando venda no storage:', newSale.id, newSale.number);
        console.log('🏢 DataContext: establishment_id:', establishmentId);
        // Salvar venda
        await storage.addSale(newSale);
        console.log('✅ DataContext: Venda salva no storage');
        setSales(prev => [newSale, ...prev]);

        console.log('📦 DataContext: Atualizando estoque dos produtos vendidos...');
        // Atualizar estoque dos produtos
        const itemsById = new Map(items.map(item => [item.product.id, item.quantity]));
        const updatedProducts = products.map(p => {
          if (itemsById.has(p.id)) {
            return {
              ...p,
              quantity: p.quantity - itemsById.get(p.id)!,
              updatedAt: new Date().toISOString()
            };
          }
          return p;
        });

        // Salvar produtos atualizados
        for (const prod of updatedProducts) {
          if (itemsById.has(prod.id)) {
            console.log(`📝 DataContext: Atualizando estoque do produto ${prod.id}: ${prod.quantity}`);
            await storage.upsertProduct(prod);
          }
        }
        console.log('✅ DataContext: Estoque atualizado');
        setProducts(updatedProducts);

        // Fazer push em background APÓS salvar tudo
        doPushInBackground('processSale');
      } catch (error) {
        console.error('❌ DataContext: Erro ao salvar venda localmente:', error);
      }
    })();

    // Retornar venda temporária para não bloquear UI
    return {
      id: uuid,
      number: humanNumber,
      date: new Date().toISOString(),
      dueDate,
      total,
      profit,
      type: docType,
      clientId: client?.id,
      clientName: client?.name,
      items: items.map(item => ({
        id: generateUuid(),
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        price: item.product.price,
        purchasePrice: item.product.purchasePrice,
      })),
      observations,
      externalReference,
      paymentMethod,
      status: docType === 'receipt' ? 'paid' : 'pending',
    };
  };

  const checkout = (clientId?: string, paymentMethod?: string): Sale | undefined => {
    if (cart.length === 0) return;
    const finalClientId = clientId || clients.find(c => c.name === 'Consumidor Final')?.id;
    const sale = processSale(cart, finalClientId, 'receipt', undefined, undefined, undefined, paymentMethod);
    if (sale) {
      clearCart();
    }
    return sale;
  };

  const createDocument = (docData: {
    items: { product: Product; quantity: number }[];
    clientId: string;
    dueDate?: string;
    type: Sale['type'];
    observations?: string;
    externalReference?: string;
    paymentMethod?: string;
  }): Sale | undefined => {
    if (docData.items.length === 0 || !docData.clientId) return;
    return processSale(docData.items, docData.clientId, docData.type, docData.dueDate, docData.observations, docData.externalReference, docData.paymentMethod);
  };

  const addTransaction = (transactionData: Omit<FinancialTransaction, 'id'>) => {
    const newId = generateUuid();
    console.log('💰 DataContext: Adicionando nova transação:', newId);
    // Salvar localmente PRIMEIRO, depois sincronizar
    (async () => {
      try {
        // 🏢 Obter establishment_id do usuário logado
        const establishmentId = await getUserEstablishmentId();
        if (!establishmentId) {
          console.warn('⚠️ DataContext: Transação criada SEM establishment_id (usuário sem estabelecimento)');
        }

        const newTransaction: FinancialTransaction = {
          ...transactionData,
          id: newId,
          establishmentId: establishmentId ?? undefined, // 🏢 Incluir establishment_id
        };

        const storage = await getStorage();
        console.log('📝 DataContext: Salvando transação no storage:', newTransaction.id);
        console.log('🏢 DataContext: establishment_id:', establishmentId);
        await storage.addTransaction(newTransaction);
        console.log('✅ DataContext: Transação salva no storage');
        setTransactions(prev => [newTransaction, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        // Fazer push em background APÓS salvar
        doPushInBackground('addTransaction');
      } catch (error) {
        console.error('❌ DataContext: Erro ao salvar transação localmente:', error);
      }
    })();
  };

  const syncNow = () => {
    handleSync(true); // forcePull = true para sincronização manual
  };

  // Função para limpar todos os dados (usada no logout)
  const clearAllData = async () => {
    try {
      console.log('🗑️ DataContext: Iniciando limpeza completa de dados...');
      console.log('🗑️ DataContext: Estado atual antes da limpeza:', {
        products: products.length,
        clients: clients.length,
        sales: sales.length,
        transactions: transactions.length
      });

      // Limpar todos os estados React PRIMEIRO (para UI ficar limpa imediatamente)
      setProducts([]);
      setSales([]);
      setCart([]);
      setClients([]);
      setTransactions([]);
      console.log('✅ DataContext: Estados React limpos');

      // Depois limpar o storage (SQLite ou localStorage)
      const storage = await getStorage();
      console.log('🗑️ DataContext: Limpando storage:', storage.constructor.name);
      await storage.clearAll();
      console.log('✅ DataContext: Storage limpo');

      // Aguardar um pouco para garantir que tudo foi limpo
      await new Promise(resolve => setTimeout(resolve, 100));

      console.log('✅ DataContext: Todos os dados foram limpos com sucesso');
    } catch (error) {
      console.error('❌ DataContext: Erro ao limpar dados:', error);
      // Mesmo com erro, limpar estados React
      setProducts([]);
      setSales([]);
      setCart([]);
      setClients([]);
      setTransactions([]);
    }
  };

  // Detectar logout/login e agir apropriadamente
  useEffect(() => {
    // Ignorar o primeiro render (montagem inicial do componente)
    if (isFirstRender.current) {
      isFirstRender.current = false;
      prevUserRef.current = user;
      return;
    }

    // LOGOUT: Se havia usuário antes e agora não há mais
    if (prevUserRef.current && !user) {
      console.log('🚪 DataContext: Logout detectado, limpando todos os dados...');
      console.log('🚪 DataContext: prevUserRef.current:', prevUserRef.current?.email || prevUserRef.current?.id);
      console.log('🚪 DataContext: user atual:', user ? 'EXISTE' : 'NULL');
      clearAllData();
    }

    // LOGIN: SEMPRE que houver usuário e não estava antes
    // Isso garante pull em QUALQUER login, não só na primeira vez
    if (!prevUserRef.current && user && loaded) {
      console.log('👋 DataContext: Login detectado, limpando dados ANTES do pull...');
      console.log('👋 DataContext: User email:', user.email);
      console.log('👋 DataContext: User id:', user.id);

      // 🆕 SOLUÇÃO 2: LIMPAR DADOS ANTES DE FAZER PULL
      // Isso garante que dados de outros estabelecimentos não sejam mesclados
      (async () => {
        try {
          console.log('🧹 DataContext: Iniciando limpeza completa antes do pull...');
          const storage = await getStorage();
          await storage.clearAll();

          // Limpar estados React também
          setProducts([]);
          setSales([]);
          setCart([]);
          setClients([]);
          setTransactions([]);

          console.log('✅ DataContext: Dados limpos completamente, aguardando antes do pull...');

          // Aguardar tempo suficiente para garantir que clearAll completou
          await new Promise(resolve => setTimeout(resolve, 500));

          // Agora fazer pull (que vai baixar apenas dados do establishment_id correto)
          if (isOnline) {
            console.log('🔄 DataContext: Executando sincronização OBRIGATÓRIA pós-login...');
            handleSync(true); // forcePull = true - SEMPRE fazer pull no login
          } else {
            console.log('📴 DataContext: Offline, pull será feito quando voltar online');
          }
        } catch (error) {
          console.error('❌ DataContext: Erro ao limpar dados antes do pull:', error);
          // Mesmo com erro, tentar fazer pull (melhor que não fazer nada)
          if (isOnline) {
            setTimeout(() => {
              console.log('🔄 DataContext: Tentando pull mesmo após erro na limpeza...');
              handleSync(true);
            }, 1000);
          }
        }
      })();
    }

    prevUserRef.current = user;
  }, [user, loaded, isOnline]);

  // Sincronização automática ao carregar (apenas se online e tiver usuário)
  useEffect(() => {
    if (loaded && isOnline && user) {
      const timer = setTimeout(() => {
        console.log('🔄 DataContext: Sincronização automática ao carregar app...');
        console.log('🔄 DataContext: Fazendo pull para garantir dados atualizados...');
        handleSync(true); // SEMPRE fazer pull ao carregar
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [loaded, isOnline, user]);

  const value: DataContextType = {
    products, sales, cart, clients, transactions, isLoaded: loaded,
    addProduct, addClient, updateClient, updateStock, addToCart, removeFromCart,
    updateCartQuantity, clearCart, checkout, createDocument, updateProduct, deleteProduct, deleteClient,
    addTransaction,
    isSyncing,
    syncNow,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
