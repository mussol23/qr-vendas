
export interface PendingDelete {
    id: string;
    table: 'products' | 'clients';
}

const QUEUE_KEY = 'offline_delete_queue';

export function getPendingDeletes(): PendingDelete[] {
    try {
        const raw = localStorage.getItem(QUEUE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        console.error('Erro ao ler fila de deleção offline:', e);
        return [];
    }
}

export function addPendingDelete(item: PendingDelete) {
    try {
        const queue = getPendingDeletes();
        // Evitar duplicatas
        if (!queue.some(i => i.id === item.id && i.table === item.table)) {
            queue.push(item);
            localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
            console.log(`🗑️ OfflineQueue: Item adicionado à fila: ${item.table}/${item.id}`);
        }
    } catch (e) {
        console.error('Erro ao adicionar à fila de deleção offline:', e);
    }
}

export function removePendingDelete(id: string, table: 'products' | 'clients') {
    try {
        const queue = getPendingDeletes();
        const filtered = queue.filter(i => !(i.id === id && i.table === table));
        localStorage.setItem(QUEUE_KEY, JSON.stringify(filtered));
        console.log(`✅ OfflineQueue: Item removido da fila: ${table}/${id}`);
    } catch (e) {
        console.error('Erro ao remover da fila de deleção offline:', e);
    }
}

export function clearPendingDeletes() {
    localStorage.removeItem(QUEUE_KEY);
}
