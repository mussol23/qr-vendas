# 🔧 Correção: Erro de PDF no Mobile

## ❌ Erro Original
```
Erro ao gerar PDF: Cannot read properties of undefined (reading 'map')
```

## 🔍 Causa
O erro ocorria porque `sale.items` estava `undefined` quando:
1. A venda era carregada do SQLite
2. O mapeamento dos campos não estava correto (snake_case vs camelCase)

---

## ✅ Correções Aplicadas

### 1. `lib/pdfSale.ts` - Validação e Proteção
```typescript
// Validação no início da função
if (!sale) {
    console.error('❌ PDF: Sale é null ou undefined');
    alert('Erro: Dados da venda não encontrados');
    throw new Error('Sale não pode ser null');
}

if (!sale.items || !Array.isArray(sale.items)) {
    console.error('❌ PDF: sale.items é inválido:', sale.items);
    alert('Erro: Itens da venda não encontrados');
    throw new Error('sale.items deve ser um array');
}

// Proteção no mapeamento
const tableData = (sale.items || []).map(item => [
    item.productName,
    item.quantity.toString(),
    formatCurrency(item.price),
    formatCurrency(item.price * item.quantity),
]);
```

### 2. `storage/mobile.ts` - Mapeamento Correto dos Items
```typescript
async getSales(): Promise<Sale[]> {
    // ...
    for (const s of sales) {
        const itemsRes = await this.db.query('SELECT * FROM sale_items WHERE sale_id = ? ORDER BY rowid ASC', [s.id]);
        const rawItems = (itemsRes.values ?? []) as any[];
        
        // Mapear snake_case para camelCase
        s.items = rawItems.map((item: any) => ({
            productId: item.productId || item.product_id,
            productName: item.productName || item.product_name,
            quantity: item.quantity,
            price: item.price,
            purchasePrice: item.purchasePrice || item.purchase_price
        }));
        
        console.log(`📦 SQLite: Venda ${s.id} com ${s.items.length} itens`);
    }
    // ...
}
```

---

## 🧪 Como Testar

### 1. Rebuild do App
```bash
npm run build
npx cap sync
npx cap open android
```

### 2. Criar uma Venda
1. Abrir o app no Android
2. Ir para "Vendas" (POS)
3. Adicionar produtos ao carrinho
4. Finalizar venda

### 3. Testar PDF
1. Ir para "Documentos"
2. Abrir a venda recém-criada
3. Clicar em "Download PDF"
4. **Verificar logs no Logcat:**

```
📄 PDF: Gerando PDF para venda: [id]
✅ PDF: Venda válida com 2 itens
📱 Mobile: Gerando PDF...
✅ PDF salvo em: content://...
✅ PDF compartilhado com sucesso!
```

### 4. Se Ainda Houver Erro
**Procure no Logcat:**
```
❌ PDF: Sale é null ou undefined
OU
❌ PDF: sale.items é inválido: undefined
OU
📦 SQLite: Venda [id] com 0 itens  <-- Items não foram carregados
```

---

## 📋 Checklist de Diagnóstico

### Ao Criar Venda
- [ ] `💾 SQLite: Salvando venda: [id]`
- [ ] `✅ SQLite: Venda salva e commitada`

### Ao Reabrir App
- [ ] `📦 SQLite: Carregando vendas...`
- [ ] `📦 SQLite: Venda [id] com X itens` (X > 0)
- [ ] `✅ SQLite: N vendas carregadas`

### Ao Gerar PDF
- [ ] `📄 PDF: Gerando PDF para venda: [id]`
- [ ] `✅ PDF: Venda válida com X itens`
- [ ] `📱 Mobile: Gerando PDF...` (se mobile)
- [ ] `✅ PDF compartilhado com sucesso!`

---

## 🔧 Se o Problema Persistir

### Items não aparecem (0 itens)
1. **Verificar se a venda está salvando items:**
   ```
   💾 SQLite: Salvando venda: [id]
   ```
   - Se não aparecer logs dos items sendo salvos, o problema está no `addSale`

2. **Verificar se items estão no banco:**
   - Use o Logcat filter: `sale_items`
   - Deve aparecer: `📦 SQLite: Venda [id] com X itens`

3. **Limpar dados e testar de novo:**
   - Configurações > Apps > QR Vendas > Armazenamento > Limpar dados
   - Reinstalar o app
   - Criar nova venda
   - Me enviar logs completos

---

## 📤 O Que Enviar em Caso de Erro

1. **Logs do Logcat** (filtrado por "Console" ou "Chromium")
2. **Screenshot do erro**
3. **Confirmar se:**
   - [ ] A venda foi criada (aparece em "Documentos")
   - [ ] A venda tem itens (mostra produtos na tela)
   - [ ] O erro ocorre ao clicar em "Download PDF"

---

## ✅ Se Funcionar

Me avise que o PDF está sendo gerado e compartilhado corretamente! 🎉

