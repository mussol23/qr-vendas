import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { DownloadIcon, PrinterIcon, EnvelopeIcon, ReceiptRefundIcon, DocumentDuplicateIcon, QuestionMarkCircleIcon, ChevronLeftIcon } from '../components/Icons';
import { generateSalePdf } from '../lib/pdfSale';
import { getStorage } from '../storage';
import type { Sale } from '../types';

const EmailModal: React.FC<{
    docId: string;
    onClose: () => void;
}> = ({ docId, onClose }) => {
    const [email, setEmail] = useState('');
    const [isSending, setIsSending] = useState(false);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            alert('Por favor, insira um endereço de e-mail válido.');
            return;
        }
        setIsSending(true);
        // Simulate sending email
        setTimeout(() => {
            setIsSending(false);
            alert(`Documento ${docId} enviado para ${email}`);
            onClose();
        }, 1500);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-sm">
                <form onSubmit={handleSend}>
                    <div className="p-6">
                        <h2 className="text-xl font-bold mb-1">Enviar por E-mail</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">O documento {docId} será enviado como anexo.</p>
                        <label htmlFor="email" className="block text-sm font-medium mb-1">Endereço de E-mail</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="exemplo@dominio.com"
                            required
                            className="w-full p-2 border rounded bg-white text-gray-900 dark:text-white dark:bg-gray-700 dark:border-gray-600"
                        />
                    </div>
                    <div className="flex bg-gray-50 dark:bg-gray-700/50 rounded-b-lg">
                        <button type="button" onClick={onClose} className="w-1/2 p-3 font-semibold hover:bg-gray-100 dark:hover:bg-gray-600 rounded-bl-lg transition-colors">Cancelar</button>
                        <button
                            type="submit"
                            disabled={isSending}
                            className="w-1/2 p-3 text-white bg-brand-600 font-semibold hover:bg-brand-700 rounded-br-lg transition-colors border-l dark:border-gray-600 disabled:bg-brand-400"
                        >
                            {isSending ? 'Enviando...' : 'Enviar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const DocumentDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { sales, clients, products, addToCart, updateCartQuantity } = useData();
    const [isEmailModalOpen, setEmailModalOpen] = useState(false);
    const [resolvedSale, setResolvedSale] = useState<Sale | null>(null);
    const [loadingItems, setLoadingItems] = useState(false);

    const sale = sales.find(s => s.id === id);

    useEffect(() => {
        let isMounted = true;
        if (sale) {
            setResolvedSale(sale);
            if (!sale.items || sale.items.length === 0) {
                console.log('📄 DocumentDetail: venda sem itens em memória, buscando no storage...', sale.id);
                setLoadingItems(true);
                (async () => {
                    try {
                        const storage = await getStorage();
                        const storedSales = await storage.getSales().catch(() => []);
                        const found = storedSales.find(s => s.id === sale.id);
                        if (found && found.items && found.items.length && isMounted) {
                            console.log('✅ DocumentDetail: itens carregados do storage:', found.items.length);
                            setResolvedSale(found);
                        }
                    } catch (error) {
                        console.warn('⚠️ DocumentDetail: erro ao buscar itens no storage', error);
                    } finally {
                        if (isMounted) setLoadingItems(false);
                    }
                })();
            }
        } else {
            setResolvedSale(null);
        }
        return () => { isMounted = false; };
    }, [sale]);

    const saleToShow = resolvedSale || sale;
    const client = clients.find(c => c.id === saleToShow?.clientId);

    if (!saleToShow) {
        return (
            <div className="text-center p-10">
                <h2 className="text-2xl font-bold">Documento não encontrado</h2>
                <p className="text-gray-500">O documento que você está procurando não existe ou foi movido.</p>
                <Link to="/documents" className="mt-4 inline-block px-4 py-2 bg-brand-600 text-white rounded-lg">Voltar para Documentos</Link>
            </div>
        );
    }
    
    const docTypeDisplay = saleToShow.type === 'invoice' ? 'FT' : saleToShow.type === 'receipt' ? 'RC' : 'FR';
    const subtotal = (saleToShow.items || []).reduce((sum, item) => sum + item.price * item.quantity, 0);
    const formatCurrency = (value: number) => value.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' });


    return (
        <div className="relative">
            <div className="flex flex-col lg:flex-row gap-6">
                {/* Main Content */}
                <div className="flex-1 space-y-6 bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-sm">
                    {/* Header */}
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                            <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 lg:hidden">
                                <ChevronLeftIcon className="h-6 w-6" />
                            </button>
                            <span className="flex-shrink-0 bg-brand-100 dark:bg-brand-900 text-brand-600 dark:text-brand-300 font-bold h-12 w-12 flex items-center justify-center rounded-full text-lg">{docTypeDisplay}</span>
                            <div>
                                <h1 className="text-xl sm:text-2xl font-bold">{saleToShow.number || saleToShow.id}</h1>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{new Date(saleToShow.date).toLocaleDateString('pt-AO', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
                            </div>
                        </div>
                        <button className="flex items-center gap-2 px-3 py-1 text-sm border border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/50 text-green-700 dark:text-green-300 rounded-full font-semibold">
                            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                            Pago
                        </button>
                    </div>

                    {/* Client Info */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-400 dark:text-gray-500">CLIENTE</h3>
                        <div className="mt-1">
                            <p className="font-bold text-brand-600 dark:text-brand-400">{client?.name}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">{client?.address}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">Angola</p>
                        </div>
                    </div>
                    
                    {/* Observations */}
                    <div className="border-t dark:border-gray-700 pt-4">
                        <h3 className="text-lg font-bold">Observações</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                            {saleToShow.observations || 'Nenhuma observação.'}
                        </p>
                    </div>

                    {/* Items */}
                    <div className="border-t dark:border-gray-700 pt-4">
                        <h3 className="text-lg font-bold">Itens</h3>
                        {loadingItems && (!(saleToShow.items && saleToShow.items.length)) && (
                            <p className="text-sm text-gray-500 py-4">Carregando itens do documento...</p>
                        )}
                        {!loadingItems && (!saleToShow.items || saleToShow.items.length === 0) && (
                            <p className="text-sm text-gray-500 py-4">Nenhum item encontrado para este documento.</p>
                        )}
                        {saleToShow.items && saleToShow.items.length > 0 && (
                            <>
                                {/* Desktop Table */}
                                <div className="mt-2 -mx-6 hidden lg:block">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                                            <tr>
                                                <th className="px-6 py-2 text-left font-semibold">Produto</th>
                                                <th className="px-6 py-2 text-right font-semibold">P.Unit.</th>
                                                <th className="px-6 py-2 text-right font-semibold">Qtd.</th>
                                                <th className="px-6 py-2 text-right font-semibold">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {saleToShow.items.map(item => (
                                                <tr key={item.productId} className="border-b dark:border-gray-700">
                                                    <td className="px-6 py-3">
                                                        <p className="font-semibold text-gray-800 dark:text-gray-200">{item.productName}</p>
                                                        <p className="text-xs text-gray-500">{item.productId}</p>
                                                    </td>
                                                    <td className="px-6 py-3 text-right">{formatCurrency(item.price)}</td>
                                                    <td className="px-6 py-3 text-right">{item.quantity}</td>
                                                    <td className="px-6 py-3 text-right font-semibold">{formatCurrency(item.price * item.quantity)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {/* Mobile Cards */}
                                <div className="lg:hidden mt-2 space-y-3">
                                    {saleToShow.items.map(item => (
                                        <div key={item.productId} className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                                            <p className="font-semibold text-gray-800 dark:text-gray-200">{item.productName}</p>
                                            <div className="flex justify-between items-center mt-1 text-sm">
                                                <span className="text-gray-500 dark:text-gray-400">{item.quantity} x {formatCurrency(item.price)}</span>
                                                <span className="font-semibold">{formatCurrency(item.price * item.quantity)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                    
                    {/* Totals */}
                    <div className="flex justify-end pt-4">
                        <div className="w-full max-w-xs space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-gray-400">Subtotal</span>
                                <span>{formatCurrency(subtotal)}</span>
                            </div>
                             <div className="flex justify-between font-bold text-lg border-t dark:border-gray-600 pt-2">
                                <span className="text-gray-800 dark:text-gray-100">Total</span>
                                <span className="text-gray-800 dark:text-gray-100">{formatCurrency(saleToShow.total)}</span>
                            </div>
                        </div>
                    </div>

                     {/* Payment Method */}
                    <div className="border-t dark:border-gray-700 pt-4">
                        <h3 className="text-lg font-bold">Método de Pagamento</h3>
                         <div className="mt-2 -mx-6 hidden lg:block">
                             <table className="w-full text-sm">
                                <thead className="bg-gray-50 dark:bg-gray-700/50">
                                    <tr>
                                        <th className="px-6 py-2 text-left font-semibold">Tipo</th>
                                        <th className="px-6 py-2 text-right font-semibold">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b dark:border-gray-700">
                                        <td className="px-6 py-3">{saleToShow.paymentMethod || 'N/D'}</td>
                                        <td className="px-6 py-3 text-right">{formatCurrency(saleToShow.total)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div className="lg:hidden mt-2 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Tipo:</span>
                                <span className="font-semibold">{saleToShow.paymentMethod || 'N/D'}</span>
                            </div>
                            <div className="flex justify-between mt-1">
                                <span className="text-gray-500">Total:</span>
                                <span className="font-semibold">{formatCurrency(saleToShow.total)}</span>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Sidebar */}
                <div className="lg:w-80 space-y-4 flex-shrink-0">
                    <div className="hidden lg:flex items-center gap-2">
                         <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                            <ChevronLeftIcon className="h-6 w-6" />
                        </button>
                        <span className="font-semibold">Voltar aos Documentos</span>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm space-y-2">
                        <h3 className="font-bold text-lg">Ações do Documento</h3>
                        <button onClick={async () => {
                            try {
                                console.log('📄 Iniciando geração de PDF do documento...', saleToShow.id);
                                console.log('📦 Venda:', JSON.stringify({ id: saleToShow.id, items: saleToShow.items?.length || 0, type: saleToShow.type }));
                                
                                // Garantir que items existe
                                if (!saleToShow.items || !Array.isArray(saleToShow.items) || saleToShow.items.length === 0) {
                                    console.error('❌ Sale.items inválido:', saleToShow.items);
                                    alert('Erro: Esta venda não tem itens. Por favor, recarregue a página e tente novamente.');
                                    return;
                                }
                                
                                // Criar uma cópia da sale com items garantidos
                                const saleWithItems = {
                                    ...saleToShow,
                                    items: saleToShow.items || []
                                };
                                
                                console.log('✅ Gerando PDF com', saleWithItems.items.length, 'itens');
                                await generateSalePdf(saleWithItems, client, saleToShow.type === 'invoice' ? 'Fatura' : saleToShow.type === 'receipt' ? 'Recibo' : 'Fatura-Recibo');
                                console.log('✅ PDF gerado com sucesso!');
                            } catch (e: any) {
                                console.error('❌ Erro ao gerar PDF:', e);
                                alert(`Falha ao gerar PDF: ${e?.message || 'Erro desconhecido'}. Verifique o console para mais detalhes.`);
                            }
                        }} className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg">
                           <span className="flex items-center gap-2"><DownloadIcon/> Download PDF</span>
                        </button>
                         <button onClick={() => setEmailModalOpen(true)} className="w-full flex items-center p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg"><span className="flex items-center gap-2"><EnvelopeIcon/> Enviar por E-mail</span></button>
                         <button onClick={() => alert('Nota de crédito: em breve.')} className="w-full flex items-center p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg"><span className="flex items-center gap-2"><ReceiptRefundIcon/> Nota de Crédito</span></button>
                         <button onClick={() => {
                            // Copia itens para o carrinho (POS)
                            (saleToShow.items || []).forEach(item => {
                                const p = products.find(pp => pp.id === item.productId);
                                if (p) {
                                    const q = Math.min(item.quantity, p.quantity);
                                    if (q > 0) {
                                        addToCart(p);
                                        updateCartQuantity(p.id, q);
                                    }
                                }
                            });
                            navigate('/pos');
                         }} className="w-full flex items-center p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg"><span className="flex items-center gap-2"><DocumentDuplicateIcon/> Copiar p/ Novo Documento</span></button>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm space-y-2">
                        <h3 className="font-bold text-lg">Relacionados</h3>
                        <div className="flex justify-between text-sm p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg">
                            <span>FT 01P2024/6</span>
                            <span className="font-semibold">13.000,00 Kz</span>
                        </div>
                    </div>
                     <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                        <h3 className="font-bold text-lg">Outras Informações</h3>
                         <p className="text-sm text-gray-500 mt-2">Nenhuma informação adicional disponível.</p>
                    </div>
                </div>
            </div>
             {/* Floating Help Button */}
            <button className="fixed bottom-20 lg:bottom-6 right-4 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-transform transform hover:scale-110 flex items-center justify-center gap-2">
                <QuestionMarkCircleIcon className="h-6 w-6"/>
            </button>
            {isEmailModalOpen && <EmailModal docId={saleToShow.id} onClose={() => setEmailModalOpen(false)} />}
        </div>
    );
};

export default DocumentDetailPage;