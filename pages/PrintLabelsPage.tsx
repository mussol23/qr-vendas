import React, { useState, useMemo } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { useData } from '../context/DataContext';
import { PrinterIcon, MagnifyingGlassIcon } from '../components/Icons';
import jsPDF from 'jspdf';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';


const PrintLabelsPage: React.FC = () => {
    const { products } = useData();
    const [labelQuantities, setLabelQuantities] = useState<Record<string, number>>({});
    const [searchTerm, setSearchTerm] = useState('');

    const handleQuantityChange = (productId: string, quantity: number) => {
        const newQuantities = { ...labelQuantities };
        if (quantity > 0) {
            newQuantities[productId] = quantity;
        } else {
            delete newQuantities[productId];
        }
        setLabelQuantities(newQuantities);
    };

    const filteredProducts = useMemo(() => {
        return products.filter(product =>
            product.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [products, searchTerm]);

    // FIX: Cast quantity to number to resolve TypeScript type inference issues.
    const productsToPrint = Object.entries(labelQuantities)
        .map(([id, quantity]) => ({
            product: products.find(p => p.id === id),
            quantity: quantity as number
        }))
        .filter(item => item.product);

    const totalLabels = productsToPrint.reduce((sum, item) => sum + item.quantity, 0);

    const generatePdf = async () => {
        if (productsToPrint.length === 0) {
            alert('Selecione pelo menos um produto para gerar as etiquetas.');
            return;
        }

        try {
            const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });

            const page = { width: 210, height: 297 };
            const margin = { top: 10, right: 7, bottom: 10, left: 7 };
            const label = { width: 48.5, height: 25.4, gapX: 0, gapY: 0 };
            const cols = 4;
            const rows = 11;
            const labelsPerPage = cols * rows;

            let x = margin.left;
            let y = margin.top;
            let countOnPage = 0;

            productsToPrint.forEach(({ product, quantity }) => {
                if (!product) return;
                for (let i = 0; i < quantity; i++) {
                    if (countOnPage >= labelsPerPage) {
                        doc.addPage();
                        x = margin.left;
                        y = margin.top;
                        countOnPage = 0;
                    }

                    const canvas = document.getElementById(`qr-${product.id}`) as HTMLCanvasElement;
                    if (canvas) {
                        const imgData = canvas.toDataURL('image/png');

                        const qrSize = label.height - 8;
                        doc.addImage(imgData, 'PNG', x + 2, y + (label.height - qrSize) / 2, qrSize, qrSize);

                        doc.setFontSize(8);
                        doc.text(product.name, x + qrSize + 4, y + 8, { maxWidth: label.width - qrSize - 6 });
                        doc.setFontSize(10);
                        doc.text(product.price.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' }), x + qrSize + 4, y + 16);
                    }

                    x += label.width + label.gapX;
                    if ((countOnPage + 1) % cols === 0) {
                        x = margin.left;
                        y += label.height + label.gapY;
                    }
                    countOnPage++;
                }
            });

            // Salvar PDF - diferente para mobile e web
            const fileName = 'etiquetas-produtos.pdf';

            if (Capacitor.isNativePlatform()) {
                // MOBILE: Usar Filesystem + Share
                try {
                    console.log('📱 Mobile: Gerando PDF de etiquetas...');
                    const pdfBase64 = doc.output('dataurlstring').split(',')[1];

                    const result = await Filesystem.writeFile({
                        path: fileName,
                        data: pdfBase64,
                        directory: Directory.Cache
                    });

                    console.log('✅ PDF salvo em:', result.uri);

                    await Share.share({
                        title: fileName,
                        text: 'Etiquetas de Produtos',
                        url: result.uri,
                        dialogTitle: 'Partilhar PDF'
                    });

                    console.log('✅ PDF compartilhado com sucesso!');
                } catch (mobileError: any) {
                    console.error('❌ Erro ao salvar PDF no mobile:', mobileError);
                    alert(`Erro ao gerar PDF: ${mobileError.message || 'Erro desconhecido'}`);
                }
            } else {
                // WEB: Download normal
                doc.save(fileName);
            }
        } catch (error) {
            console.error('Falha ao carregar bibliotecas ou gerar o PDF de etiquetas:', error);
            alert('Ocorreu um erro ao carregar os recursos para gerar o PDF. Verifique sua conexão e tente novamente.');
        }
    };

    return (
        <div className="flex flex-col md:flex-row gap-4 h-full max-h-[calc(100vh-100px)]">
            {/* Product Selection List */}
            <div className="md:w-1/3 flex flex-col bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <h2 className="text-xl font-bold mb-2">Selecionar Produtos</h2>

                <div className="relative mb-4">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                    </span>
                    <input
                        type="text"
                        placeholder="Pesquisar por nome..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full p-2 pl-10 border rounded-lg bg-white text-gray-900 dark:text-white dark:bg-gray-700 dark:border-gray-600 focus:ring-brand-500 focus:border-brand-500"
                    />
                </div>

                <div className="flex justify-between items-center mb-2 border-b dark:border-gray-700 pb-2">
                    <span className="text-sm text-gray-500">{Object.keys(labelQuantities).length} produto(s) selecionado(s)</span>
                </div>
                <div className="flex-1 overflow-y-auto pr-2 space-y-2">
                    {filteredProducts.length > 0 ? (
                        filteredProducts.map(product => (
                            <div key={product.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <span className="text-sm flex-1 pr-2">{product.name}</span>
                                <input
                                    type="number"
                                    min="0"
                                    placeholder="Qtd"
                                    value={labelQuantities[product.id] || ''}
                                    onChange={(e) => handleQuantityChange(product.id, parseInt(e.target.value) || 0)}
                                    className="w-20 p-1 border rounded text-center bg-white text-gray-900 dark:text-white dark:bg-gray-700 dark:border-gray-600"
                                />
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-gray-500 pt-4">Nenhum produto encontrado.</p>
                    )}
                </div>
            </div>

            {/* Preview and Action */}
            <div className="md:w-2/3 flex flex-col">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-4">
                    <p className="text-gray-600 dark:text-gray-400">
                        Defina a quantidade de etiquetas para cada produto e clique em gerar PDF.
                    </p>
                    <button
                        onClick={generatePdf}
                        disabled={totalLabels === 0}
                        className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:bg-gray-400"
                    >
                        <PrinterIcon />
                        Gerar PDF com {totalLabels} etiqueta(s)
                    </button>
                </div>

                <div className="hidden">
                    {products.map(product => <QRCodeCanvas id={`qr-${product.id}`} value={product.qrCode} size={256} key={product.id} />)}
                </div>

                <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-700 p-4 shadow-lg border-2 border-gray-300 dark:border-gray-600 rounded-lg">
                    <div className="grid grid-cols-4 gap-2">
                        {productsToPrint.slice(0, 44).flatMap(({ product, quantity }) =>
                            Array.from({ length: Math.min(quantity, 44) }, (_, i) => (
                                <div key={`${product!.id}-${i}`} className="border dark:border-gray-600 p-1 flex items-center text-[8px] leading-tight">
                                    <QRCodeCanvas value={product!.qrCode} size={24} level="L" />
                                    <div className="ml-1 flex flex-col overflow-hidden">
                                        <span className="font-bold truncate">{product!.name}</span>
                                        <span>{product!.price.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</span>
                                    </div>
                                </div>
                            ))
                        )}
                        {totalLabels > 44 && <div className="text-center col-span-4 text-xs p-4">... e mais {totalLabels - 44}</div>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrintLabelsPage;