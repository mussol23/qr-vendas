import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { DownloadIcon, PlusIcon, TrashIcon, QuestionMarkCircleIcon, CalendarDaysIcon, ClockIcon, BanknotesIcon, TicketIcon, TruckIcon, ScaleIcon, AcademicCapIcon, DocumentTextIcon, MinusIcon, MagnifyingGlassIcon, ArchiveBoxIcon, PlusCircleIcon } from '../components/Icons';
import { Sale, Client, Product } from '../types';
import { QRCodeCanvas } from 'qrcode.react';
import { Link, useNavigate } from 'react-router-dom';


declare global {
    interface Window {
        jspdf: any;
    }
}

const loadScript = (src: string) => new Promise<void>((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Script load error for ${src}`));
    document.head.appendChild(script);
});

const getDocTypeDisplay = (type: Sale['type']) => {
    switch (type) {
        case 'invoice': return { short: 'FT', long: 'Fatura' };
        case 'receipt': return { short: 'RC', long: 'Recibo' };
        case 'invoice-receipt': return { short: 'FR', long: 'Fatura/Recibo' };
    }
}

// Editor for a single setting
const SettingEditor: React.FC<{
    settingKey: string;
    currentValue: any;
    onSave: (value: any) => void;
    onCancel: () => void;
}> = ({ settingKey, currentValue, onSave, onCancel }) => {
    
    const renderEditor = () => {
        switch (settingKey) {
            case 'emissionDate':
            case 'availabilityDate':
            case 'dueDate': {
                const [date, setDate] = useState(currentValue);
                return (
                    <>
                        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full p-2 border rounded bg-white text-gray-900 dark:text-white dark:bg-gray-900 dark:border-gray-600" />
                        <div className="flex justify-end gap-2 mt-2">
                            <button onClick={onCancel} className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded">Cancelar</button>
                            <button onClick={() => onSave(date)} className="px-3 py-1 text-sm bg-brand-600 text-white rounded">Salvar</button>
                        </div>
                    </>
                );
            }
            case 'paymentMethod': {
                const [method, setMethod] = useState(currentValue);
                const methods = ['Dinheiro', 'Transferência Bancária', 'Pagamento por Referência'];
                return (
                    <>
                        <div className="space-y-2">
                            {methods.map(m => (
                                <label key={m} className="flex items-center gap-2 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-900">
                                    <input type="radio" name="paymentMethod" value={m} checked={method === m} onChange={() => setMethod(m)} className="form-radio text-brand-600" />
                                    <span>{m}</span>
                                </label>
                            ))}
                        </div>
                        <div className="flex justify-end gap-2 mt-2">
                            <button onClick={onCancel} className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded">Cancelar</button>
                            <button onClick={() => onSave(method)} className="px-3 py-1 text-sm bg-brand-600 text-white rounded">Salvar</button>
                        </div>
                    </>
                );
            }
            case 'discount': {
                 const [type, setType] = useState(currentValue.type);
                 const [value, setValue] = useState(currentValue.value);
                 return (
                     <div className="space-y-3">
                         <div className="flex gap-4">
                            <label className="flex items-center gap-2">
                                <input type="radio" name="discountType" value="percentage" checked={type === 'percentage'} onChange={() => setType('percentage')} /> %
                            </label>
                             <label className="flex items-center gap-2">
                                <input type="radio" name="discountType" value="fixed" checked={type === 'fixed'} onChange={() => setType('fixed')} /> Valor Fixo
                            </label>
                         </div>
                         <input type="number" value={value} onChange={e => setValue(parseFloat(e.target.value))} className="w-full p-2 border rounded bg-white text-gray-900 dark:text-white dark:bg-gray-900 dark:border-gray-600" placeholder={`Valor em ${type === 'percentage' ? '%' : 'Kz'}`} />
                         <div className="flex justify-end gap-2 mt-2">
                            <button onClick={onCancel} className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded">Cancelar</button>
                            <button onClick={() => onSave({type, value})} className="px-3 py-1 text-sm bg-brand-600 text-white rounded">Salvar</button>
                        </div>
                     </div>
                 );
            }
            case 'transport':
            case 'retention':
            case 'trainingMode': {
                const [boolValue, setBoolValue] = useState(currentValue);
                return (
                     <>
                        <div className="flex gap-4">
                           <label className="flex items-center gap-2">
                                <input type="radio" name={settingKey} checked={boolValue === true} onChange={() => setBoolValue(true)} /> Sim
                            </label>
                            <label className="flex items-center gap-2">
                                <input type="radio" name={settingKey} checked={boolValue === false} onChange={() => setBoolValue(false)} /> Não
                            </label>
                        </div>
                        <div className="flex justify-end gap-2 mt-2">
                            <button onClick={onCancel} className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded">Cancelar</button>
                            <button onClick={() => onSave(boolValue)} className="px-3 py-1 text-sm bg-brand-600 text-white rounded">Salvar</button>
                        </div>
                    </>
                );
            }
            default: return null;
        }
    }

    return (
        <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md border dark:border-gray-600">
            {renderEditor()}
        </div>
    )
}


const DocumentSettings: React.FC<{
    settings: any;
    onUpdateSetting: (key: string, value: any) => void;
    editingSetting: string | null;
    setEditingSetting: (key: string | null) => void;
}> = ({ settings, onUpdateSetting, editingSetting, setEditingSetting }) => {
    
    const settingsConfig = [
        { key: 'mainBox', icon: <CalendarDaysIcon />, label: 'Caixa principal', value: 'Loja principal', editable: false },
        { key: 'emissionDate', icon: <CalendarDaysIcon />, label: 'Data de Emissão', value: new Date(settings.emissionDate).toLocaleDateString('pt-AO'), editable: true },
        { key: 'availabilityDate', icon: <CalendarDaysIcon />, label: 'Data de Disponibilização', value: new Date(settings.availabilityDate).toLocaleDateString('pt-AO'), editable: true },
        { key: 'dueDate', icon: <ClockIcon />, label: 'Vencimento', value: new Date(settings.dueDate).toLocaleDateString('pt-AO'), editable: true },
        { key: 'paymentMethod', icon: <BanknotesIcon />, label: 'Pagamentos', value: settings.paymentMethod, editable: true },
        { key: 'discount', icon: <TicketIcon />, label: 'Desconto', value: settings.discount.value > 0 ? `${settings.discount.value}${settings.discount.type === 'percentage' ? '%' : ' Kz'}` : 'Nenhum', editable: true },
        { key: 'transport', icon: <TruckIcon />, label: 'Transporte', value: settings.transport ? 'Sim' : 'Não', editable: true },
        { key: 'retention', icon: <ScaleIcon />, label: 'Retenção IPU', value: settings.retention ? 'Sim' : 'Não', editable: true },
        { key: 'trainingMode', icon: <AcademicCapIcon />, label: 'Modo Formação', value: settings.trainingMode ? 'Sim' : 'Não', editable: true },
    ];
    
    return (
        <div className="bg-white dark:bg-gray-800/50 p-4 rounded-lg shadow-sm border dark:border-gray-700">
            <h3 className="text-lg font-bold mb-4">Definições do Documento</h3>
            <div className="space-y-1">
                {settingsConfig.map((item) => (
                    <div key={item.key} className="text-sm">
                        <div className="flex justify-between items-center p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700/50">
                            <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                                {item.icon}
                                <span>{item.label}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="font-semibold text-gray-800 dark:text-gray-100">{item.value}</span>
                                {item.editable && (
                                    <button onClick={() => setEditingSetting(editingSetting === item.key ? null : item.key)} className="text-brand-600 dark:text-brand-400 font-semibold">
                                        {editingSetting === item.key ? 'Fechar' : 'Alterar'}
                                    </button>
                                )}
                            </div>
                        </div>
                        {editingSetting === item.key && (
                            <SettingEditor 
                                settingKey={item.key}
                                currentValue={settings[item.key]}
                                onSave={(newValue) => onUpdateSetting(item.key, newValue)}
                                onCancel={() => setEditingSetting(null)}
                            />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};


// Document Creator Modal (Full Screen)
const DocumentCreator: React.FC<{ docType: Sale['type'], onClose: (newSaleId?: string) => void }> = ({ docType, onClose }) => {
    const { clients, products, createDocument } = useData();
    const [selectedClientId, setSelectedClientId] = useState<string>(clients.find(c => c.name === 'Consumidor Final')?.id || '');
    const [items, setItems] = useState<{product: Product, quantity: number}[]>([]);
    const [observations, setObservations] = useState('');
    const [externalReference, setExternalReference] = useState('');
    const [editingSetting, setEditingSetting] = useState<string | null>(null);

    const [settings, setSettings] = useState({
        emissionDate: new Date().toISOString().split('T')[0],
        availabilityDate: new Date().toISOString().split('T')[0],
        dueDate: new Date().toISOString().split('T')[0],
        paymentMethod: 'Transferência Bancária',
        discount: { type: 'percentage' as 'percentage' | 'fixed', value: 0 },
        transport: false,
        retention: false,
        trainingMode: false,
    });

    const [isProductSelectorOpen, setProductSelectorOpen] = useState(false);
    const [isClientSelectorOpen, setClientSelectorOpen] = useState(false);
    const [productForQuantity, setProductForQuantity] = useState<Product | null>(null);

    const total = useMemo(() => items.reduce((sum, item) => sum + item.product.price * item.quantity, 0), [items]);
    const selectedClient = clients.find(c => c.id === selectedClientId);
    
    const handleUpdateSetting = (key: string, value: any) => {
        setSettings(prev => ({ ...prev, [key]: value }));
        setEditingSetting(null); // Close editor on save
    };

    const handleSelectProduct = (product: Product) => {
        setProductSelectorOpen(false);
        setProductForQuantity(product);
    };

    const addProductWithQuantity = (product: Product, quantity: number) => {
        setItems(prev => {
            const existing = prev.find(i => i.product.id === product.id);
            const currentQuantity = existing ? existing.quantity : 0;
            
            if (currentQuantity + quantity > product.quantity) {
                alert(`Stock insuficiente. Apenas ${product.quantity} unidades disponíveis. Você já tem ${currentQuantity} no documento.`);
                return prev;
            }

            if (existing) {
                return prev.map(i => 
                    i.product.id === product.id 
                    ? { ...i, quantity: i.quantity + quantity }
                    : i
                );
            }
            return [...prev, { product, quantity }];
        });
        setProductForQuantity(null);
    };

    const removeItemFromInvoice = (productId: string) => {
        setItems(prev => prev.filter(i => i.product.id !== productId));
    }
    const updateItemQuantity = (productId: string, quantity: number) => {
        if(isNaN(quantity) || quantity < 1) {
            removeItemFromInvoice(productId);
        } else {
            setItems(prev => prev.map(i => i.product.id === productId ? {...i, quantity} : i));
        }
    }

    const handleSave = () => {
        if (!selectedClientId) {
            alert('Por favor, selecione um cliente.');
            return;
        }
        if (items.length === 0) {
            alert('Por favor, adicione pelo menos um produto.');
            return;
        }
        const newSale = createDocument({ 
            clientId: selectedClientId, 
            dueDate: docType !== 'receipt' ? settings.dueDate : undefined, 
            items,
            type: docType,
            observations,
            externalReference,
            paymentMethod: settings.paymentMethod
        });
        if (newSale) {
            onClose(newSale.id);
        }
    };

    const docDisplay = getDocTypeDisplay(docType);

    return (
        <div className="fixed inset-0 bg-gray-100 dark:bg-gray-900 z-50 flex flex-col">
            <header className="bg-white dark:bg-gray-800 shadow-sm p-4 flex justify-between items-center flex-shrink-0">
                 <button onClick={() => onClose()} className="font-semibold text-brand-600 dark:text-brand-400">{'< Fechar'}</button>
                 <h1 className="text-xl font-bold text-gray-800 dark:text-gray-200">Definições do Documento</h1>
                 <div className="w-16"></div>
            </header>
            
            <main className="flex-1 overflow-y-auto p-4">
                 <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border dark:border-gray-700">
                             <div className="flex items-center gap-4 mb-4">
                                <span className="flex-shrink-0 bg-brand-500 text-white font-bold h-10 w-10 flex items-center justify-center rounded-full text-sm">{docDisplay.short}</span>
                                <h2 className="text-2xl font-bold">{docDisplay.long}</h2>
                             </div>
                            
                            <div>
                                <label className="text-sm font-semibold flex items-center gap-1">Selecione o Cliente <QuestionMarkCircleIcon className="h-4 w-4 text-gray-400" /></label>
                                <input type="text" readOnly value={selectedClient?.name || ''} onClick={() => setClientSelectorOpen(true)} className="mt-1 w-full p-2 border rounded bg-white text-gray-900 dark:text-white dark:bg-gray-700 dark:border-gray-600 cursor-pointer" />
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border dark:border-gray-700">
                             <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-lg">Itens</h3>
                                <button className="text-sm font-bold flex items-center gap-1"><DocumentTextIcon/> Itens</button>
                             </div>
                             {items.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <DocumentTextIcon/>
                                    <p>Não existem itens associados ao documento.</p>
                                </div>
                             ) : (
                                <div className="space-y-2">
                                    {items.map(item => (
                                         <div key={item.product.id} className="flex items-center justify-between gap-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                                            <div className="flex items-center gap-2">
                                                 <input type="number" value={item.quantity} onChange={(e) => updateItemQuantity(item.product.id, parseInt(e.target.value))} className="w-16 p-1 border dark:border-gray-600 rounded text-center bg-white text-gray-900 dark:text-white dark:bg-gray-700" min="1"/>
                                                 <div className="flex-1">
                                                    <p className="font-semibold text-sm">{item.product.name}</p>
                                                    <p className="text-xs">{item.product.price.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</p>
                                                </div>
                                            </div>
                                            <button onClick={() => removeItemFromInvoice(item.product.id)} className="text-gray-400 hover:text-red-500"><TrashIcon /></button>
                                        </div>
                                    ))}
                                </div>
                             )}
                            <button onClick={() => setProductSelectorOpen(true)} className="w-full mt-4 p-2 text-center text-brand-600 dark:text-brand-400 font-semibold">
                                + Pesquisar e adicionar ao documento
                            </button>
                        </div>

                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border dark:border-gray-700">
                             <h3 className="font-bold text-lg mb-4">Observações</h3>
                             <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-semibold flex items-center gap-1">Observações <QuestionMarkCircleIcon className="h-4 w-4 text-gray-400" /></label>
                                    <textarea value={observations} onChange={e => setObservations(e.target.value)} rows={3} className="w-full mt-1 p-2 border rounded bg-white text-gray-900 dark:text-white dark:bg-gray-700 dark:border-gray-600"></textarea>
                                </div>
                                 <div>
                                    <label className="text-sm font-semibold flex items-center gap-1">Referência Externa <QuestionMarkCircleIcon className="h-4 w-4 text-gray-400" /></label>
                                    <input type="text" value={externalReference} onChange={e => setExternalReference(e.target.value)} className="w-full mt-1 p-2 border rounded bg-white text-gray-900 dark:text-white dark:bg-gray-700 dark:border-gray-600" />
                                </div>
                             </div>
                        </div>
                    </div>
                    
                    {/* Settings Sidebar */}
                    <div className="lg:col-span-1 space-y-4">
                        <DocumentSettings 
                           settings={settings}
                           onUpdateSetting={handleUpdateSetting}
                           editingSetting={editingSetting}
                           setEditingSetting={setEditingSetting}
                        />
                        <div className="space-y-2">
                            <button onClick={handleSave} className="w-full p-3 bg-brand-500 text-white rounded-lg font-bold text-lg">
                                Criar {docDisplay.long}
                            </button>
                             <button className="w-full p-3 flex items-center justify-center gap-2 text-brand-600 dark:text-brand-400 font-semibold">
                                <QuestionMarkCircleIcon className="h-6 w-6"/> Precisa de Ajuda?
                            </button>
                        </div>
                    </div>
                 </div>
            </main>
           
            {isProductSelectorOpen && <ProductSelectionModal products={products} onSelect={handleSelectProduct} onClose={() => setProductSelectorOpen(false)} />}
            {productForQuantity && <QuantitySelectionModal product={productForQuantity} onClose={() => setProductForQuantity(null)} onConfirm={addProductWithQuantity} />}
            {isClientSelectorOpen && <ClientSelectionModal onSelect={(client) => setSelectedClientId(client.id)} onClose={() => setClientSelectorOpen(false)}/>}
        </div>
    )
}

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
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[70] p-4">
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
                    <button onClick={handleConfirm} className="w-1/2 p-3 text-white bg-brand-600 font-semibold hover:bg-brand-700 rounded-br-lg transition-colors border-l dark:border-gray-600">Adicionar</button>
                </div>
            </div>
        </div>
    );
};

const ProductSelectionModal: React.FC<{products: Product[], onSelect: (p: Product) => void, onClose: () => void}> = ({products, onSelect, onClose}) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredProducts = products.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) && p.quantity > 0
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60] p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg h-3/4 flex flex-col">
                <div className="p-4 border-b dark:border-gray-700 space-y-3">
                    <h2 className="text-xl font-bold">Adicionar Produto</h2>
                    <input
                        type="text"
                        placeholder="Buscar pelo nome..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="p-2 border rounded-lg w-full bg-white text-gray-900 dark:text-white dark:bg-gray-700 dark:border-gray-600"
                    />
                </div>
                <div className="flex-1 overflow-y-auto p-2">
                    {filteredProducts.map(p => (
                        <button key={p.id} onClick={() => onSelect(p)} className="w-full text-left p-3 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex justify-between items-center">
                            <div>
                                <p className="font-semibold">{p.name}</p>
                                <p className="text-sm text-gray-500">{p.price.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</p>
                            </div>
                            <span className="text-xs text-gray-400">Stock: {p.quantity}</span>
                        </button>
                    ))}
                </div>
                <div className="p-2 border-t dark:border-gray-700">
                    <button onClick={onClose} className="w-full p-2 bg-gray-200 dark:bg-gray-600 rounded-lg">Fechar</button>
                </div>
            </div>
        </div>
    );
};

const ClientSelectionModal: React.FC<{onSelect: (c: Client) => void, onClose: () => void}> = ({onSelect, onClose}) => {
    const { clients } = useData();
    const [searchTerm, setSearchTerm] = useState('');

    const filteredClients = clients.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.nif.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return(
            <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60] p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg h-3/4 flex flex-col">
                <div className="p-4 border-b dark:border-gray-700 space-y-3">
                    <h2 className="text-xl font-bold">Selecionar Cliente</h2>
                    <input
                        type="text"
                        placeholder="Buscar por nome ou NIF..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="p-2 border rounded-lg w-full bg-white text-gray-900 dark:text-white dark:bg-gray-700 dark:border-gray-600"
                    />
                </div>
                <div className="flex-1 overflow-y-auto p-2">
                    {filteredClients.map(c => (
                        <button key={c.id} onClick={() => { onSelect(c); onClose(); }} className="w-full text-left p-3 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                            <p className="font-semibold">{c.name}</p>
                            <p className="text-sm text-gray-500">NIF: {c.nif}</p>
                        </button>
                    ))}
                </div>
                <div className="p-2 border-t dark:border-gray-700">
                    <button onClick={onClose} className="w-full p-2 bg-gray-200 dark:bg-gray-600 rounded-lg">Fechar</button>
                </div>
            </div>
        </div>
    )
};

const SelectDocTypeModal: React.FC<{ onSelect: (type: Sale['type']) => void, onClose: () => void }> = ({ onSelect, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-sm">
                <h2 className="text-xl font-bold p-4 border-b dark:border-gray-700">Selecione o Tipo de Documento</h2>
                <div className="p-4 space-y-3">
                    <button onClick={() => onSelect('invoice')} className="w-full p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors">Fatura</button>
                    <button onClick={() => onSelect('receipt')} className="w-full p-3 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-semibold transition-colors">Recibo</button>
                    <button onClick={() => onSelect('invoice-receipt')} className="w-full p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors">Fatura/Recibo</button>
                </div>
                <div className="p-2 border-t dark:border-gray-700">
                    <button onClick={onClose} className="w-full p-2">Cancelar</button>
                </div>
            </div>
        </div>
    )
}

const FilterModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onApply: (filters: {clientName: string, startDate: string, endDate: string}) => void;
}> = ({ isOpen, onClose, onApply }) => {
    const [clientName, setClientName] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    if (!isOpen) return null;

    const handleApply = () => {
        onApply({ clientName, startDate, endDate });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 transition-opacity duration-300" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold p-4 border-b dark:border-gray-700">Filtrar Documentos</h2>
                <div className="p-4 space-y-4">
                    <div>
                        <label className="text-sm font-medium">Nome do Cliente</label>
                        <input type="text" value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Pesquisar cliente..." className="mt-1 w-full p-2 border rounded bg-white text-gray-900 dark:text-white dark:bg-gray-700 dark:border-gray-600"/>
                    </div>
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="text-sm font-medium">De</label>
                            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1 w-full p-2 border rounded bg-white text-gray-900 dark:text-white dark:bg-gray-700 dark:border-gray-600"/>
                        </div>
                        <div className="flex-1">
                             <label className="text-sm font-medium">Até</label>
                            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="mt-1 w-full p-2 border rounded bg-white text-gray-900 dark:text-white dark:bg-gray-700 dark:border-gray-600"/>
                        </div>
                    </div>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 flex justify-end gap-2 rounded-b-lg">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-lg">Cancelar</button>
                    <button onClick={handleApply} className="px-4 py-2 bg-brand-600 text-white rounded-lg">Aplicar Filtro</button>
                </div>
            </div>
            <style>{`
                @keyframes fade-in-scale {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-fade-in-scale { animation: fade-in-scale 0.3s forwards cubic-bezier(0.16, 1, 0.3, 1); }
            `}</style>
        </div>
    );
}

const TABS: { id: Sale['type'], label: string }[] = [
    { id: 'invoice', label: 'Faturas' },
    { id: 'receipt', label: 'Recibos' },
    { id: 'invoice-receipt', label: 'Fatura/Recibo' },
];

const DocumentsPage: React.FC = () => {
    const { sales, clients } = useData();
    const navigate = useNavigate();
    const [docCreatorType, setDocCreatorType] = useState<Sale['type'] | null>(null);
    const [isSelectingType, setIsSelectingType] = useState(false);
    const [activeTab, setActiveTab] = useState<Sale['type']>('invoice');
    const [isFilterModalOpen, setFilterModalOpen] = useState(false);
    const [appliedFilters, setAppliedFilters] = useState<{clientName: string, startDate: string, endDate: string}>({clientName: '', startDate: '', endDate: ''});

    const filteredDocuments = useMemo(() => {
        let docs = sales.filter(sale => sale.type === activeTab);
        
        if (appliedFilters.clientName) {
            docs = docs.filter(doc => doc.clientName?.toLowerCase().includes(appliedFilters.clientName.toLowerCase()));
        }
        if (appliedFilters.startDate) {
            const startDate = new Date(appliedFilters.startDate);
            startDate.setHours(0, 0, 0, 0);
            docs = docs.filter(doc => new Date(doc.date) >= startDate);
        }
        if (appliedFilters.endDate) {
            const endDate = new Date(appliedFilters.endDate);
            endDate.setHours(23, 59, 59, 999);
            docs = docs.filter(doc => new Date(doc.date) <= endDate);
        }
        return docs;
    }, [sales, activeTab, appliedFilters]);
    
    const summaryStats = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        const tabSales = sales.filter(s => s.type === activeTab);
        return {
            total: tabSales.length,
            createdToday: tabSales.filter(s => s.date.split('T')[0] === today).length,
            pending: tabSales.filter(s => s.status === 'pending').length
        };
    }, [sales, activeTab]);

    const handleCloseCreator = (newSaleId?: string) => {
        setDocCreatorType(null);
        if (newSaleId) {
            navigate(`/documents/${newSaleId}`);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Documentos</h2>
                <div className="flex items-center gap-2">
                     <button onClick={() => setFilterModalOpen(true)} className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                        <MagnifyingGlassIcon className="h-6 w-6"/>
                    </button>
                    <button onClick={() => setIsSelectingType(true)} className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg">
                        <PlusIcon /> Criar Documento
                    </button>
                </div>
            </div>
            
            {/* Hidden QR codes for PDF generation */}
            <div style={{ display: 'none' }}>
                {sales.map(sale => (
                    <QRCodeCanvas 
                        key={sale.id}
                        id={`qr-for-pdf-${sale.id}`} 
                        value={`ID:${sale.id};Data:${new Date(sale.date).toISOString().split('T')[0]};Total:${sale.total};NIF:${clients.find(c=>c.id === sale.clientId)?.nif || 'N/A'}`}
                        size={256}
                    />
                ))}
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
                <div className="bg-white dark:bg-gray-800 p-2 sm:p-3 rounded-lg shadow">
                    <ArchiveBoxIcon className="h-5 w-5 mx-auto text-blue-500" />
                    <p className="text-xs sm:text-sm font-semibold mt-1">Total</p>
                    <p className="text-sm sm:text-lg font-bold">{summaryStats.total}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-2 sm:p-3 rounded-lg shadow">
                    <PlusCircleIcon className="h-5 w-5 mx-auto text-green-500" />
                    <p className="text-xs sm:text-sm font-semibold mt-1">Criados Hoje</p>
                    <p className="text-sm sm:text-lg font-bold">{summaryStats.createdToday}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-2 sm:p-3 rounded-lg shadow">
                    <ClockIcon className="h-5 w-5 mx-auto text-orange-500" />
                    <p className="text-xs sm:text-sm font-semibold mt-1">Pendentes</p>
                    <p className="text-sm sm:text-lg font-bold">{summaryStats.pending}</p>
                </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="border-b border-gray-200 dark:border-gray-700">
                    <nav className="-mb-px flex space-x-4 px-4" aria-label="Tabs">
                        {TABS.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`${
                                    activeTab === tab.id
                                        ? 'border-brand-500 text-brand-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                                } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>
                {filteredDocuments.length === 0 ? (
                    <div className="text-center py-10">
                        <p className="text-gray-500">Nenhum documento encontrado.</p>
                    </div>
                ) : (
                    <ul className="divide-y dark:divide-gray-700">
                        {filteredDocuments.map(sale => {
                            const client = clients.find(c => c.id === sale.clientId);
                            return (
                               <li key={sale.id}>
                                    <Link to={`/documents/${sale.id}`} className="block p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-bold">{getDocTypeDisplay(sale.type).long} #{sale.id}</p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">{new Date(sale.date).toLocaleDateString('pt-AO')}</p>
                                                {sale.clientName && <p className="text-xs mt-1">Cliente: {sale.clientName}</p>}
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-lg text-brand-600 dark:text-brand-400">{sale.total.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</p>
                                                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${sale.status === 'paid' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'}`}>{sale.status === 'paid' ? 'Pago' : 'Pendente'}</span>
                                            </div>
                                        </div>
                                   </Link>
                               </li>
                            )
                        })}
                    </ul>
                )}
            </div>
            {isSelectingType && <SelectDocTypeModal onClose={() => setIsSelectingType(false)} onSelect={(type) => { setIsSelectingType(false); setDocCreatorType(type); }} />}
            {docCreatorType && <DocumentCreator docType={docCreatorType} onClose={handleCloseCreator}/>}
            <FilterModal isOpen={isFilterModalOpen} onClose={() => setFilterModalOpen(false)} onApply={setAppliedFilters} />
        </div>
    );
};

export default DocumentsPage;