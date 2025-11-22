import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Product } from '../types';
import { PlusIcon, PrinterIcon, QrCodeIcon, PencilIcon, CubeIcon, MagnifyingGlassIcon, ArchiveBoxIcon, PlusCircleIcon, ArrowPathIcon, TrashIcon } from '../components/Icons';
import { QRCodeCanvas } from 'qrcode.react';
import { Link } from 'react-router-dom';
import ConfirmModal from '../components/ConfirmModal';
import { useToast } from '../context/ToastContext';

const ProductEditorModal: React.FC<{ product?: Product; onClose: () => void }> = ({ product, onClose }) => {
    const { addProduct, updateProduct } = useData();
    const { showToast } = useToast();
    const [name, setName] = useState(product?.name || '');
    const [price, setPrice] = useState(product?.price?.toString() || '');
    const [purchasePrice, setPurchasePrice] = useState(product?.purchasePrice?.toString() || '');
    const [quantity, setQuantity] = useState(product?.quantity?.toString() || '');
    const [category, setCategory] = useState(product?.category || '');
    const [image, setImage] = useState(product?.image || '');
    const [unit, setUnit] = useState(product?.unit || '');

    const isEditing = !!product;

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const numPrice = parseFloat(price) || 0;
        const numPurchasePrice = parseFloat(purchasePrice) || 0;
        const numQuantity = parseInt(quantity) || 0;

        if (isEditing) {
            updateProduct({ ...product, name, price: numPrice, purchasePrice: numPurchasePrice, quantity: numQuantity, category, image, unit });
            showToast('Produto atualizado com sucesso!', 'success');
        } else {
            addProduct({ name, price: numPrice, purchasePrice: numPurchasePrice, quantity: numQuantity, category, image, unit });
            showToast('Produto criado com sucesso!', 'success');
        }
        onClose();
    };

    const [show, setShow] = useState(false);
    React.useEffect(() => {
        const t = requestAnimationFrame(() => setShow(true));
        return () => cancelAnimationFrame(t);
    }, []);

    return (
        <div className={`fixed inset-0 flex items-center justify-center z-50 p-4 transition-colors duration-200 ${show ? 'bg-black/50' : 'bg-black/0'}`}>
            <div className={`bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto transition-all duration-200 ease-out ${show ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-2'}`}>
                <h2 className="text-2xl font-bold mb-4">{isEditing ? 'Editar Produto' : 'Adicionar Novo Produto'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Imagem do Produto</label>
                        {image && <img src={image} alt="Pré-visualização" className="h-24 w-auto object-contain my-2 bg-gray-100 dark:bg-gray-700 p-1 rounded" />}
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 dark:file:bg-brand-900/50 dark:file:text-brand-300 dark:hover:file:bg-brand-900"
                        />
                    </div>
                    <input type="text" placeholder="Nome do Produto" value={name} onChange={e => setName(e.target.value)} required className="w-full p-2 border rounded bg-white text-gray-900 dark:text-white dark:bg-gray-700 dark:border-gray-600" />
                    <input type="number" step="0.01" placeholder="Preço de Compra" value={purchasePrice} onChange={e => setPurchasePrice(e.target.value)} required className="w-full p-2 border rounded bg-white text-gray-900 dark:text-white dark:bg-gray-700 dark:border-gray-600" />
                    <input type="number" step="0.01" placeholder="Preço de Venda" value={price} onChange={e => setPrice(e.target.value)} required className="w-full p-2 border rounded bg-white text-gray-900 dark:text-white dark:bg-gray-700 dark:border-gray-600" />
                    <input type="number" placeholder="Quantidade em Stock" value={quantity} onChange={e => setQuantity(e.target.value)} required className="w-full p-2 border rounded bg-white text-gray-900 dark:text-white dark:bg-gray-700 dark:border-gray-600" />
                    <input type="text" placeholder="Unidade de Medida (ex.: kg, un, L)" value={unit} onChange={e => setUnit(e.target.value)} className="w-full p-2 border rounded bg-white text-gray-900 dark:text-white dark:bg-gray-700 dark:border-gray-600" />
                    <input type="text" placeholder="Categoria" value={category} onChange={e => setCategory(e.target.value)} required className="w-full p-2 border rounded bg-white text-gray-900 dark:text-white dark:bg-gray-700 dark:border-gray-600" />
                    <div className="flex justify-end space-x-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-brand-600 text-white rounded">{isEditing ? 'Salvar Alterações' : 'Salvar'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const ProductCard: React.FC<{ product: Product, onEdit: (product: Product) => void, onDelete: (product: Product) => void }> = ({ product, onEdit, onDelete }) => {
    const [showQR, setShowQR] = useState(false);
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex flex-col justify-between">
            <div>
                {product.image ? (
                    <img src={product.image} alt={product.name} className="w-full h-32 object-cover rounded-md mb-2" />
                ) : (
                    <div className="w-full h-32 bg-gray-200 dark:bg-gray-700 rounded-md mb-2 flex items-center justify-center text-gray-400 dark:text-gray-500">
                        <CubeIcon />
                    </div>
                )}
                <div className="flex justify-between items-start">
                    <h3 className="font-bold text-lg pr-2">{product.name}</h3>
                    <div className="flex items-center space-x-2 flex-shrink-0">
                        <button onClick={() => onEdit(product)} className="text-gray-400 hover:text-blue-500">
                            <PencilIcon className="h-5 w-5" />
                        </button>
                        <button onClick={() => onDelete(product)} className="text-gray-400 hover:text-red-500">
                            <TrashIcon className="h-5 w-5" />
                        </button>
                    </div>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{product.category}</p>
                <p className="text-brand-600 dark:text-brand-400 font-semibold mt-2">{product.price.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</p>
                <p className={`mt-1 text-sm ${product.quantity < 10 ? 'text-red-500 font-bold' : 'text-gray-600 dark:text-gray-300'}`}>
                    Stock: {product.quantity}
                </p>
            </div>
            <button onClick={() => setShowQR(!showQR)} className="mt-4 flex items-center justify-center space-x-2 text-sm text-brand-600 dark:text-brand-400">
                <QrCodeIcon />
                <span>{showQR ? 'Esconder' : 'Mostrar'} QR Code</span>
            </button>
            {showQR && (
                <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-700 rounded flex flex-col items-center">
                    <QRCodeCanvas value={product.qrCode} size={128} />
                    <p className="text-xs mt-2 font-mono">{product.id}</p>
                </div>
            )}
        </div>
    );
};


const ProductsPage: React.FC = () => {
    const { products, deleteProduct } = useData();
    const { showToast } = useToast();
    const [isEditorOpen, setEditorOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);
    const [searchTerm, setSearchTerm] = useState('');
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState<Product | null>(null);

    const handleOpenEditor = (product?: Product) => {
        setEditingProduct(product);
        setEditorOpen(true);
    };

    const handleCloseEditor = () => {
        setEditingProduct(undefined);
        setEditorOpen(false);
    };

    const handleDeleteClick = (product: Product) => {
        setProductToDelete(product);
        setDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (productToDelete) {
            try {
                await deleteProduct(productToDelete.id);
                showToast(`Produto "${productToDelete.name}" removido com sucesso!`, 'success');
            } catch (error) {
                console.error(error);
                showToast('Erro ao remover produto.', 'error');
            }
            setDeleteModalOpen(false);
            setProductToDelete(null);
        }
    };

    const filteredProducts = useMemo(() => {
        return products.filter(product =>
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.category.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [products, searchTerm]);

    const today = new Date().toISOString().split('T')[0];
    const summaryStats = useMemo(() => {
        let addedToday = 0;
        let updatedToday = 0;
        products.forEach(p => {
            const createdAtDate = p.createdAt.split('T')[0];
            const updatedAtDate = p.updatedAt.split('T')[0];
            if (createdAtDate === today) {
                addedToday++;
            }
            if (updatedAtDate === today && createdAtDate !== today) {
                updatedToday++;
            }
        });
        return {
            total: products.length,
            addedToday,
            updatedToday
        };
    }, [products]);

    return (
        <div className="relative">
            <div className="mb-4 space-y-4">
                <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                    </span>
                    <input
                        type="text"
                        placeholder="Pesquisar por nome ou categoria..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full p-2 pl-10 border rounded-lg bg-white text-gray-900 dark:text-white dark:bg-gray-800 dark:border-gray-600 focus:ring-brand-500 focus:border-brand-500"
                    />
                </div>
                <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
                    <div className="bg-white dark:bg-gray-800 p-2 sm:p-3 rounded-lg shadow">
                        <ArchiveBoxIcon className="h-5 w-5 mx-auto text-blue-500" />
                        <p className="text-xs sm:text-sm font-semibold mt-1">Total</p>
                        <p className="text-sm sm:text-lg font-bold">{summaryStats.total}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-2 sm:p-3 rounded-lg shadow">
                        <PlusCircleIcon className="h-5 w-5 mx-auto text-green-500" />
                        <p className="text-xs sm:text-sm font-semibold mt-1">Adicionados Hoje</p>
                        <p className="text-sm sm:text-lg font-bold">{summaryStats.addedToday}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-2 sm:p-3 rounded-lg shadow">
                        <ArrowPathIcon className="h-5 w-5 mx-auto text-yellow-500" />
                        <p className="text-xs sm:text-sm font-semibold mt-1">Atualizados Hoje</p>
                        <p className="text-sm sm:text-lg font-bold">{summaryStats.updatedToday}</p>
                    </div>
                </div>
            </div>

            {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-20">
                    {filteredProducts.map(product => <ProductCard key={product.id} product={product} onEdit={handleOpenEditor} onDelete={handleDeleteClick} />)}
                </div>
            ) : (
                <div className="text-center py-10 bg-white dark:bg-gray-800 rounded-lg">
                    <p className="text-gray-500">Nenhum produto encontrado com o termo "{searchTerm}".</p>
                </div>
            )}

            <div className="fixed bottom-20 right-4 flex flex-col space-y-3 z-20">
                <Link to="/print-labels" className="bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-transform transform hover:scale-110">
                    <PrinterIcon />
                </Link>
                <button onClick={() => handleOpenEditor()} className="bg-brand-600 text-white p-4 rounded-full shadow-lg hover:bg-brand-700 transition-transform transform hover:scale-110">
                    <PlusIcon />
                </button>
            </div>

            {isEditorOpen && <ProductEditorModal product={editingProduct} onClose={handleCloseEditor} />}

            <ConfirmModal
                isOpen={deleteModalOpen}
                title="Remover Produto"
                message={`Tem a certeza que deseja apagar o produto "${productToDelete?.name}"? Esta ação não pode ser desfeita.`}
                onConfirm={handleConfirmDelete}
                onCancel={() => setDeleteModalOpen(false)}
            />
        </div>
    );
};

export default ProductsPage;