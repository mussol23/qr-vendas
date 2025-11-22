import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { Product, Sale, Client } from '../types';
import { TrashIcon, XCircleIcon, ShoppingCartIcon, UsersIcon, WhatsAppIcon, PlusIcon, CameraIcon, DownloadIcon, MinusIcon, BanknotesIcon, TicketIcon, DocumentTextIcon, TrendingUpIcon, CheckCircleIcon } from '../components/Icons';
import { Capacitor } from '@capacitor/core';
import { Camera } from '@capacitor/camera';

declare global {
    interface Window {
        jspdf: any;
        Html5Qrcode: any;
    }
}

import { generateSalePdf } from '../lib/pdfSale';

const generateReceiptPdf = async (sale: Sale, client?: Client | null) => {
    try {
        console.log('Iniciando geração de PDF...');
        await generateSalePdf(sale, client, 'Recibo');
        console.log('PDF gerado com sucesso!');
    } catch (error) {
        console.error('Falha ao gerar o PDF do recibo:', error);
        alert(`Erro ao gerar PDF: ${error instanceof Error ? error.message : 'Erro desconhecido'}. Verifique o console para mais detalhes.`);
    }
};

const ReceiptShareModal: React.FC<{ sale: Sale; onClose: () => void }> = ({ sale, onClose }) => {
    const { clients } = useData();
    const client = clients.find(c => c.id === sale.clientId);
    
    const shareViaWhatsApp = () => {
        let message = `*Recibo: ${sale.id}*\n`;
        message += `Data: ${new Date(sale.date).toLocaleString('pt-AO')}\n`;
        if (client) {
            message += `Cliente: ${client.name}\n`;
        }
        if (sale.paymentMethod) {
            message += `Pagamento: ${sale.paymentMethod}\n`;
        }
        message += '----------------------\n';
        sale.items.forEach(item => {
            message += `${item.quantity}x ${item.productName} - ${item.price.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}\n`;
        });
        message += '----------------------\n';
        message += `*Total: ${sale.total.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}*`;

        const encodedMessage = encodeURIComponent(message);
        window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-sm font-sans">
                <div className="p-6 text-center">
                    <h2 className="text-2xl font-bold text-green-500">Venda Concluída!</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Recibo #{sale.number || sale.id}</p>
                    {sale.paymentMethod && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Pagamento: {sale.paymentMethod}</p>}
                    
                    <div className="text-left my-6 space-y-2 text-sm max-h-48 overflow-y-auto pr-2">
                        {sale.items.map(item => (
                            <div key={item.productId} className="flex justify-between">
                                <span className="flex-1 truncate pr-2">{item.quantity}x {item.productName}</span>
                                <span className="font-mono">{item.price.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</span>
                            </div>
                        ))}
                    </div>
                    <div className="border-t dark:border-gray-700 pt-4 flex justify-between font-bold text-lg">
                        <span>Total:</span>
                        <span className="font-mono">{sale.total.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</span>
                    </div>
                </div>
                <div className="grid grid-cols-3 bg-gray-50 dark:bg-gray-700/50 rounded-b-lg">
                    <button onClick={() => generateReceiptPdf(sale, client)} className="p-4 text-brand-600 font-semibold hover:bg-gray-100 dark:hover:bg-gray-600 rounded-bl-lg transition-colors flex items-center justify-center gap-2">
                        <DownloadIcon /> PDF
                    </button>
                     <button onClick={shareViaWhatsApp} className="p-4 text-green-600 font-semibold hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2 border-l dark:border-gray-600">
                        <WhatsAppIcon /> Partilhar
                    </button>
                    <button onClick={onClose} className="p-4 font-semibold hover:bg-gray-100 dark:hover:bg-gray-600 rounded-br-lg transition-colors border-l dark:border-gray-600">Fechar</button>
                </div>
            </div>
        </div>
    );
};


const ProductSelectionModal: React.FC<{
    products: Product[];
    onSelect: (product: Product) => void;
    onClose: () => void;
    onOpenCamera: () => void;
}> = ({ products, onSelect, onClose, onOpenCamera }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) && p.quantity > 0);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-40 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg h-3/4 flex flex-col">
                <div className="p-4 border-b dark:border-gray-700 space-y-3">
                    <h2 className="text-xl font-bold">Adicionar Produto</h2>
                     <button onClick={onOpenCamera} className="w-full p-3 bg-gray-600 dark:bg-gray-700 text-white rounded-lg flex items-center justify-center gap-2 font-semibold hover:bg-gray-700 dark:hover:bg-gray-600">
                        <CameraIcon /> Escanear QR Code
                    </button>
                    <input
                        type="text"
                        placeholder="Ou buscar pelo nome..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="p-2 border rounded-lg w-full bg-white text-gray-900 dark:text-white dark:bg-gray-700 dark:border-gray-600"
                    />
                </div>
                <div className="flex-1 overflow-y-auto p-2">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {filteredProducts.map(product => (
                            <button
                                key={product.id}
                                onClick={() => onSelect(product)}
                                className="p-3 border dark:border-gray-700 rounded-lg text-center hover:bg-brand-50 dark:hover:bg-brand-900/50 transition-colors"
                            >
                                <p className="font-semibold text-sm truncate">{product.name}</p>
                                <p className="text-xs text-gray-500">{product.price.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</p>
                            </button>
                        ))}
                    </div>
                </div>
                <div className="p-4 border-t dark:border-gray-700">
                    <button onClick={onClose} className="w-full p-2 bg-gray-200 dark:bg-gray-600 rounded-lg">Fechar</button>
                </div>
            </div>
        </div>
    );
};

const ClientSelectionModal: React.FC<{
    onSelect: (client: Client) => void;
    onClose: () => void;
}> = ({ onSelect, onClose }) => {
    const { clients, addClient } = useData();
    const [isAdding, setIsAdding] = useState(false);
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    // FIX: Add state for nif
    const [nif, setNif] = useState('');

    const handleAddNewClient = (e: React.FormEvent) => {
        e.preventDefault();
        // FIX: Add nif to new client
        const newClient = addClient({ name, phone, address, nif });
        onSelect(newClient);
        onClose();
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-40 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg h-3/4 flex flex-col">
                <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold">{isAdding ? 'Adicionar Cliente' : 'Selecionar Cliente'}</h2>
                    <button onClick={() => setIsAdding(!isAdding)} className="text-brand-600 text-sm font-semibold p-2 flex items-center gap-1">
                        {isAdding ? 'Cancelar' : <><PlusIcon /> Novo</>}
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                    {isAdding ? (
                        <form onSubmit={handleAddNewClient} className="space-y-4">
                            <input type="text" placeholder="Nome do Cliente" value={name} onChange={e => setName(e.target.value)} required className="w-full p-2 border rounded bg-white text-gray-900 dark:text-white dark:bg-gray-700 dark:border-gray-600"/>
                            <input type="tel" placeholder="Nº de Telefone" value={phone} onChange={e => setPhone(e.target.value)} required className="w-full p-2 border rounded bg-white text-gray-900 dark:text-white dark:bg-gray-700 dark:border-gray-600"/>
                            <input type="text" placeholder="Endereço" value={address} onChange={e => setAddress(e.target.value)} required className="w-full p-2 border rounded bg-white text-gray-900 dark:text-white dark:bg-gray-700 dark:border-gray-600"/>
                            {/* FIX: Add nif input field */}
                            <input type="text" placeholder="NIF" value={nif} onChange={e => setNif(e.target.value)} required className="w-full p-2 border rounded bg-white text-gray-900 dark:text-white dark:bg-gray-700 dark:border-gray-600"/>
                            <button type="submit" className="w-full p-2 bg-brand-600 text-white rounded">Salvar Cliente</button>
                        </form>
                    ) : (
                        <ul className="space-y-2">
                           {clients.map(client => (
                               <li key={client.id}>
                                   <button onClick={() => { onSelect(client); onClose(); }} className="w-full text-left p-3 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <p className="font-semibold">{client.name}</p>
                                        <p className="text-sm text-gray-500">Telefone: {client.phone}</p>
                                        {/* FIX: Display client nif */}
                                        <p className="text-sm text-gray-500">NIF: {client.nif}</p>
                                   </button>
                               </li>
                           ))}
                        </ul>
                    )}
                </div>
                 <div className="p-4 border-t dark:border-gray-700">
                    <button onClick={onClose} className="w-full p-2 bg-gray-200 dark:bg-gray-600 rounded-lg">Fechar</button>
                </div>
            </div>
        </div>
    );
};

const QuantitySelectionModal: React.FC<{ 
    product: Product; 
    onClose: () => void;
    onConfirm: (product: Product, quantity: number) => void;
}> = ({ product, onClose, onConfirm }) => {
    const [quantity, setQuantity] = useState(1);

    const handleConfirm = () => {
        if (quantity > 0) {
            onConfirm(product, quantity);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-sm">
                <div className="p-6">
                    <h2 className="text-xl font-bold">{product.name}</h2>
                    <div className="my-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        <p className="text-brand-600 dark:text-brand-400 font-semibold text-lg">{product.price.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</p>
                        <p className="text-sm text-gray-500">Stock disponível: {product.quantity}</p>
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="quantity" className="block text-sm font-medium">Quantidade:</label>
                        <div className="flex items-center gap-2">
                             <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="p-2 border rounded-md dark:border-gray-600"><MinusIcon className="h-5 w-5"/></button>
                             <input
                                type="number"
                                id="quantity"
                                value={quantity}
                                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                min="1"
                                max={product.quantity}
                                className="w-full p-2 border rounded text-center font-bold text-lg bg-white text-gray-900 dark:text-white dark:bg-gray-700 dark:border-gray-600"
                            />
                            <button onClick={() => setQuantity(q => Math.min(product.quantity, q + 1))} className="p-2 border rounded-md dark:border-gray-600"><PlusIcon className="h-5 w-5"/></button>
                        </div>
                       
                    </div>
                </div>
                <div className="flex bg-gray-50 dark:bg-gray-700/50 rounded-b-lg">
                    <button onClick={onClose} className="w-1/2 p-3 font-semibold hover:bg-gray-100 dark:hover:bg-gray-600 rounded-bl-lg transition-colors">Cancelar</button>
                    <button onClick={handleConfirm} className="w-1/2 p-3 text-white bg-brand-600 font-semibold hover:bg-brand-700 rounded-br-lg transition-colors border-l dark:border-gray-600">Adicionar ao Carrinho</button>
                </div>
            </div>
        </div>
    );
};

const PaymentMethodModal: React.FC<{
    onSelect: (method: string) => void;
    onClose: () => void;
}> = ({ onSelect, onClose }) => {
    const paymentMethods = [
        { name: 'Dinheiro', icon: <BanknotesIcon className="h-6 w-6"/> },
        { name: 'Transferência Bancária', icon: <DocumentTextIcon /> },
        { name: 'Por Referência', icon: <TicketIcon className="h-6 w-6"/> },
    ];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-sm">
                <div className="p-6">
                    <h2 className="text-xl font-bold mb-4 text-center">Forma de Pagamento</h2>
                    <div className="space-y-3">
                        {paymentMethods.map(method => (
                            <button
                                key={method.name}
                                onClick={() => onSelect(method.name)}
                                className="w-full p-4 flex items-center justify-center gap-3 border dark:border-gray-600 rounded-lg text-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                {method.icon}
                                <span>{method.name}</span>
                            </button>
                        ))}
                    </div>
                </div>
                <div className="p-2 border-t dark:border-gray-700">
                    <button onClick={onClose} className="w-full p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50">Cancelar</button>
                </div>
            </div>
        </div>
    );
};

const POSPage: React.FC = () => {
    const { products, cart, addToCart, removeFromCart, updateCartQuantity, checkout, clearCart, clients, sales } = useData();
    const [receipt, setReceipt] = useState<Sale | null>(null);
    const [isProductSelectorOpen, setProductSelectorOpen] = useState(false);
    const [isClientModalOpen, setClientModalOpen] = useState(false);
    const [isCameraScannerOpen, setCameraScannerOpen] = useState(false);
    const [productForQuantity, setProductForQuantity] = useState<Product | null>(null);
    const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
    const [selectedClient, setSelectedClient] = useState<Client | null>(() => clients.find(c => c.name === 'Consumidor Final') || null);
    
    const handleSetSelectedClient = (client: Client) => {
        setSelectedClient(client);
    };

    const cartTotal = useMemo(() =>
        cart.reduce((total, item) => total + item.product.price * item.quantity, 0),
        [cart]);

    const todayStats = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        const todaySales = sales.filter(sale => sale.date.split('T')[0] === today);
        
        const totalSales = todaySales.reduce((sum, sale) => sum + sale.total, 0);
        const totalProfit = todaySales.reduce((sum, sale) => sum + (sale.profit || 0), 0);

        return { totalSales, totalProfit };
    }, [sales]);

    const formatCurrency = (value: number) => value.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' });

    const handleCheckout = () => {
        if (cart.length === 0) return;
        setPaymentModalOpen(true);
    };

    const finalizeSale = (paymentMethod: string) => {
        setPaymentModalOpen(false);
        const newSale = checkout(selectedClient?.id, paymentMethod);
        if (newSale) {
            setReceipt(newSale);
            setSelectedClient(clients.find(c => c.name === 'Consumidor Final') || null);
        }
    }

    const openCameraScanner = () => {
        setProductSelectorOpen(false);
        setCameraScannerOpen(true);
    };

    const handleAddToCartWithQuantity = (product: Product, quantity: number) => {
        const existingItem = cart.find(item => item.product.id === product.id);
        const newQuantity = (existingItem?.quantity || 0) + quantity;

        if (newQuantity > product.quantity) {
            alert(`Stock insuficiente. Apenas ${product.quantity} unidades disponíveis.`);
            return;
        }
        
        if (!existingItem) {
             addToCart(product);
        }
        updateCartQuantity(product.id, newQuantity);
        setProductForQuantity(null);
    };


    const handleScanSuccess = (productId: string) => {
        const product = products.find(p => p.id === productId);
        setCameraScannerOpen(false);
        if (product) {
            if (product.quantity > 0) {
                setProductForQuantity(product);
            } else {
                alert(`Produto "${product.name}" está fora de stock.`);
            }
        } else {
            alert(`QR Code inválido. Produto com ID "${productId}" não encontrado.`);
        }
    };

    useEffect(() => {
        if (!isCameraScannerOpen) return;

        let qrScanner: any = null;
        let mounted = true;

        const initScanner = async () => {
            try {
                console.log('📷 Inicializando scanner...');
                
                // Passo 1: Solicitar permissão Capacitor (nativo)
                if (Capacitor.isNativePlatform()) {
                    console.log('📱 Plataforma nativa detectada, solicitando permissão Capacitor...');
                    try {
                        const permResult = await Camera.requestPermissions();
                        console.log('✅ Resultado da permissão Capacitor:', permResult);
                        
                        if (permResult.camera !== 'granted' && permResult.camera !== 'limited') {
                            alert('❌ Permissão da câmera negada.\n\nPara usar o scanner:\n1. Vá em Configurações do Android\n2. Apps > QR Vendas > Permissões\n3. Ative a Câmera');
                            if (mounted) setCameraScannerOpen(false);
                            return;
                        }
                        
                        // Aguardar um pouco para o sistema processar a permissão
                        await new Promise(resolve => setTimeout(resolve, 500));
                    } catch (permErr: any) {
                        console.error('❌ Erro ao solicitar permissão Capacitor:', permErr);
                        alert(`Erro ao solicitar permissão da câmera: ${permErr.message || 'Erro desconhecido'}`);
                        if (mounted) setCameraScannerOpen(false);
                        return;
                    }
                }

                // Passo 2: Solicitar permissão do navegador (getUserMedia)
                console.log('🌐 Solicitando permissão do navegador...');
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                    console.log('✅ Permissão do navegador concedida');
                    // Parar o stream imediatamente, só precisávamos da permissão
                    stream.getTracks().forEach(track => track.stop());
                } catch (mediaErr: any) {
                    console.error('❌ Erro ao solicitar permissão do navegador:', mediaErr);
                    if (mediaErr.name === 'NotAllowedError') {
                        alert('❌ Permissão da câmera negada pelo navegador.\n\nPor favor, permita o acesso à câmera quando solicitado.');
                    } else {
                        alert(`Erro ao acessar câmera: ${mediaErr.message || 'Erro desconhecido'}`);
                    }
                    if (mounted) setCameraScannerOpen(false);
                    return;
                }

                // Passo 3: Verificar se há câmeras disponíveis
                let cameras;
                try {
                    cameras = await window.Html5Qrcode.getCameras();
                    console.log('📷 Câmeras encontradas:', cameras?.length || 0);
                    if (!cameras || cameras.length === 0) {
                        alert('Nenhuma câmera encontrada no dispositivo.');
                        if (mounted) setCameraScannerOpen(false);
                        return;
                    }
                } catch (camErr: any) {
                    console.error('❌ Erro ao listar câmeras:', camErr);
                    alert(`Erro ao acessar câmeras: ${camErr.message || 'Erro desconhecido'}`);
                    if (mounted) setCameraScannerOpen(false);
                    return;
                }

                // Passo 4: Criar e iniciar scanner
                if (!mounted) return;
                
                try {
                    qrScanner = new window.Html5Qrcode("qr-reader-inline");
                    const config = { 
                        fps: 10, 
                        qrbox: { width: 250, height: 250 },
                        aspectRatio: 1.0
                    };

                    console.log('🎥 Iniciando scanner...');
                    await qrScanner.start(
                        { facingMode: "environment" },
                        config,
                        (decodedText: string) => {
                            console.log('✅ QR Code lido:', decodedText);
                            handleScanSuccess(decodedText);
                        },
                        (errorMessage: string) => {
                            if (!errorMessage.includes('NotFoundException')) {
                                console.debug('QR scan error:', errorMessage);
                            }
                        }
                    );
                    console.log('✅ Scanner iniciado com sucesso!');
                } catch (startErr: any) {
                    console.error('❌ Erro ao iniciar scanner:', startErr);
                    alert(`Erro ao iniciar scanner: ${startErr.message || 'Erro desconhecido'}\n\nTente fechar e reabrir o scanner.`);
                    if (mounted) setCameraScannerOpen(false);
                }
            } catch (err: any) {
                console.error('❌ Erro geral ao inicializar scanner:', err);
                alert(`Erro ao acessar a câmera: ${err.message || 'Erro desconhecido'}`);
                if (mounted) setCameraScannerOpen(false);
            }
        };

        initScanner();

        return () => {
            mounted = false;
            if (qrScanner) {
                try {
                    const state = qrScanner.getState();
                    if (state === 2) { // 2 = SCANNING
                        qrScanner.stop().catch((err: any) => {
                            console.warn("Limpeza do scanner (ignorável):", err);
                        });
                    }
                } catch (e) {
                    console.warn("Erro ao limpar scanner:", e);
                }
            }
        };
    }, [isCameraScannerOpen]);


    return (
        <div className="flex flex-col h-full max-h-[calc(100vh-140px)] gap-4 relative">
             <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow flex items-center justify-around text-center">
                <div className="flex-1">
                    <BanknotesIcon className="h-6 w-6 mx-auto text-green-500 mb-1" />
                    <p className="text-xs sm:text-sm font-semibold text-gray-500 dark:text-gray-400">Vendas de Hoje</p>
                    <p className="text-sm sm:text-lg font-bold">{formatCurrency(todayStats.totalSales)}</p>
                </div>
                <div className="h-12 w-px bg-gray-200 dark:bg-gray-700 mx-2"></div>
                <div className="flex-1">
                    <TrendingUpIcon className="h-6 w-6 mx-auto text-sky-500 mb-1" />
                    <p className="text-xs sm:text-sm font-semibold text-gray-500 dark:text-gray-400">Lucro de Hoje</p>
                    <p className="text-sm sm:text-lg font-bold">{formatCurrency(todayStats.totalProfit)}</p>
                </div>
            </div>

             {isCameraScannerOpen ? (
                <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow p-4 items-center justify-center">
                    <h2 className="text-xl font-bold mb-4">Aponte para o QR Code</h2>
                    <div id="qr-reader-inline" className="w-full max-w-sm"></div>
                    <button onClick={() => setCameraScannerOpen(false)} className="mt-4 px-6 py-2 bg-gray-300 dark:bg-gray-600 rounded-lg font-semibold">Cancelar</button>
                </div>
            ) : (
                <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                    <div className="mb-4 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                            <div>
                                <span className="text-xs text-gray-500">Cliente</span>
                                <p className="font-semibold">{selectedClient ? selectedClient.name : 'Consumidor Final'}</p>
                            </div>
                            <button onClick={() => setClientModalOpen(true)} className="p-2 text-brand-600 dark:text-brand-400" aria-label="Selecionar cliente">
                                <UsersIcon />
                            </button>
                        </div>
                    </div>
                    
                    <div className="flex justify-between items-center mb-2">
                        <h2 className="text-xl font-bold">Carrinho</h2>
                        <div className="flex items-center gap-4">
                            <button onClick={() => setProductSelectorOpen(true)} className="text-brand-600 dark:text-brand-400 text-sm font-semibold flex items-center gap-1 p-1">
                                <PlusIcon className="h-4 w-4" /> Adicionar
                            </button>
                            {cart.length > 0 &&
                                <button onClick={clearCart} className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1">
                                    <XCircleIcon /> Limpar
                                </button>
                            }
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {cart.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-500">
                            <ShoppingCartIcon/>
                            <p className="mt-2">O carrinho está vazio.</p>
                            <p className="text-sm">Use o botão 'Adicionar' para adicionar produtos.</p>
                            </div>
                        ) : (
                            <ul className="space-y-3 pr-2">
                                {cart.map(item => (
                                    <li key={item.product.id} className="flex items-center justify-between gap-2">
                                        <div className="flex-1">
                                            <p className="font-semibold text-sm truncate">{item.product.name}</p>
                                            <p className="text-xs text-gray-500">{item.product.price.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)} className="p-1 border rounded-md dark:border-gray-600"><MinusIcon className="h-4 w-4"/></button>
                                            <input
                                                type="number"
                                                value={item.quantity}
                                                onChange={(e) => updateCartQuantity(item.product.id, parseInt(e.target.value))}
                                                className="w-16 p-1 border dark:border-gray-600 rounded text-center font-bold bg-white text-gray-900 dark:text-white dark:bg-gray-700"
                                                min="1"
                                                max={item.product.quantity}
                                            />
                                            <button onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)} className="p-1 border rounded-md dark:border-gray-600"><PlusIcon className="h-4 w-4"/></button>
                                            <button onClick={() => removeFromCart(item.product.id)} className="text-gray-400 hover:text-red-500 p-1">
                                                <TrashIcon />
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            )}
            
            {!isCameraScannerOpen && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 space-y-3">
                    <div className="flex justify-between font-bold text-lg">
                        <span>Total:</span>
                        <span>{cartTotal.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</span>
                    </div>
                    <button
                        onClick={handleCheckout}
                        disabled={cart.length === 0}
                        className="w-full flex items-center justify-center bg-brand-600 text-white font-bold p-3 rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-brand-700 transition-colors shadow-md"
                    >
                        <CheckCircleIcon className="h-6 w-6 mr-2" />
                        Finalizar
                    </button>
                </div>
            )}
            
            {receipt && <ReceiptShareModal sale={receipt} onClose={() => setReceipt(null)} />}
            {isProductSelectorOpen && <ProductSelectionModal products={products} onSelect={setProductForQuantity} onClose={() => setProductSelectorOpen(false)} onOpenCamera={openCameraScanner}/>}
            {productForQuantity && <QuantitySelectionModal product={productForQuantity} onClose={() => setProductForQuantity(null)} onConfirm={handleAddToCartWithQuantity} />}
            {isClientModalOpen && <ClientSelectionModal onSelect={handleSetSelectedClient} onClose={() => setClientModalOpen(false)} />}
            {isPaymentModalOpen && <PaymentMethodModal onSelect={finalizeSale} onClose={() => setPaymentModalOpen(false)} />}
        </div>
    );
};
export default POSPage;