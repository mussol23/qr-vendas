# 🔧 Correção: UUID Inválido para Sale Items

## ❌ Erro no Servidor
```
Error upserting sale_items: {
  code: '22P02',
  message: 'invalid input syntax for type uuid: "d9c34312-8d28-46c1-9b89-d8b0c9d8e2c6:0"'
}
```

## 🔍 Causa
O sync estava gerando IDs inválidos para `sale_items`:
- **Formato gerado**: `"sale_id:0"`, `"sale_id:1"`, etc.
- **Formato esperado**: UUID válido (ex: `"a1b2c3d4-..."`)

### Código Problemático (antes):
```typescript
const itemUuid = ('randomUUID' in crypto) 
  ? (crypto as any).randomUUID() 
  : `${s.id}-item-${idx}`; // ❌ Não é UUID válido!
```

---

## ✅ Solução

### 1. Criado função `generateUuid()` confiável
```typescript
function generateUuid(): string {
  // Tentar usar crypto.randomUUID() se disponível
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return (crypto as any).randomUUID();
  }
  
  // Fallback: gerar UUID v4 manualmente
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
```

### 2. Usado função em saleItemsDb
```typescript
const saleItemsDb = sales
  .filter(s => isUuid(s.id))
  .flatMap(s => (s.items || []).map((it, idx) => {
    // ✅ Gerar UUID único para cada item
    const itemUuid = generateUuid();
    console.log(`🔑 Sync: Gerando UUID para sale_item ${idx}: ${itemUuid}`);
    return {
      id: itemUuid,
      sale_id: s.id,
      product_id: isUuid(it.productId) ? it.productId : null,
      product_name: it.productName,
      quantity: it.quantity,
      price: it.price,
      purchase_price: it.purchasePrice,
    };
  }));
```

---

## 📋 Como Funciona Agora

### No SQLite Local (Mobile)
```
Items salvos com ID simples: "venda_id:0", "venda_id:1", etc.
✅ Funciona perfeitamente para armazenamento local
✅ Rápido e eficiente
```

### No Push para Supabase
```
Items convertidos para UUID válido: "a1b2c3d4-...", "e5f6g7h8-...", etc.
✅ Aceito pelo Supabase
✅ Cada item recebe um UUID único novo
```

---

## 🧪 Como Testar

### 1. Rebuild
```bash
npm run build
npx cap sync
npx cap open android
```

### 2. Criar Venda no Mobile
1. Adicionar 2-3 produtos ao carrinho
2. Finalizar venda
3. Aguardar 2 segundos (sync automático)
4. **Ver logs no Logcat:**

```
💾 SQLite: Salvando venda: [venda_id]
✅ SQLite: Venda salva e commitada
📤 Sync: Iniciando push para servidor...
📊 Sync: Dados locais: {sales: 1, ...}
🔑 Sync: Gerando UUID para sale_item 0 da venda [venda_id]: a1b2c3d4-...
🔑 Sync: Gerando UUID para sale_item 1 da venda [venda_id]: e5f6g7h8-...
🔍 Sync: Dados com UUID válido: {sales: 1, sale_items: 2, ...}
📤 Sync: Enviando para servidor: sales, sale_items
✅ Sync: Push completo!
```

### 3. Verificar no Supabase
1. Abrir Supabase no navegador
2. Ir para tabela `sales` → deve ter a venda
3. Ir para tabela `sale_items` → deve ter os items
4. **Verificar IDs**: Todos devem ser UUIDs válidos ✅

### 4. Verificar Logs do Servidor (Render)
**Antes (erro)**:
```
Error upserting sale_items: invalid input syntax for type uuid
```

**Agora (sucesso)**:
```
Upserted 2 sale_items successfully
```

---

## 🔍 Diagnóstico

### Se ainda der erro no servidor:

**Procure no Logcat:**
```
🔑 Sync: Gerando UUID para sale_item...
```

**Copie um UUID gerado** e verifique se é válido:
- Formato correto: `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`
- Deve ter exatamente 36 caracteres (incluindo hífens)
- Deve ter `4` na terceira seção (versão UUID v4)

### Se não aparecer o log de UUID:
```
⚠️ sale.items está vazio ou undefined
```
→ Problema no salvamento da venda, não no UUID

---

## 📤 O Que Enviar em Caso de Problema

1. **Logs do Logcat** contendo:
   - `🔑 Sync: Gerando UUID para sale_item...`
   - O UUID gerado completo
   - Erro do push (se houver)

2. **Logs do Servidor (Render)**:
   - Error upserting sale_items (se houver)
   - Mensagem de erro completa

3. **Verificar no Supabase**:
   - Tabela `sales` tem a venda?
   - Tabela `sale_items` tem os items?
   - Se não, qual erro aparece?

---

## ✅ Se Funcionar

Você vai ver:
- ✅ Logs do Logcat: "✅ Sync: Push completo!"
- ✅ Sem erros nos logs do Render
- ✅ Venda no Supabase (tabela `sales`)
- ✅ Items no Supabase (tabela `sale_items`)
- ✅ Todos os IDs são UUIDs válidos

**Aí está resolvido!** 🎉

