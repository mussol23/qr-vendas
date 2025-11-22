import type { Sale, Client } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getStorage } from '../storage';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

export async function generateSalePdf(sale: Sale, client?: Client | null, title?: string) {
	try {
		console.log('📄 PDF: Gerando PDF para venda:', sale?.id);
		
		// Validação: verificar se sale existe e tem dados mínimos
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
		
		console.log('✅ PDF: Venda válida com', sale.items.length, 'itens');
		
		// Criar documento A4
		const doc = new jsPDF('p', 'mm', 'a4');
		const pageWidth = doc.internal.pageSize.getWidth();
		const pageHeight = doc.internal.pageSize.getHeight();
		const margin = 20;
		let cursorY = margin;

		const formatCurrency = (value: number) => value.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' });

		// Carregar dados do estabelecimento (tentar storage primeiro, depois localStorage)
		let storeName = 'Sua Loja';
		let storeNif = 'N/A';
		let storeAddress = 'Seu Endereço';
		let storePhone = 'Seu Telefone';
		let storeEmail = 'Seu Email';
		let storeLogo = localStorage.getItem('storeLogo') || '';

		try {
			const storage = await getStorage();
			const establishment = await storage.getEstablishment();
			if (establishment) {
				storeName = establishment.name || storeName;
				storeNif = establishment.document || storeNif;
				storeAddress = establishment.address || storeAddress;
				storePhone = establishment.phone || storePhone;
			}
		} catch (e) {
			console.warn('Erro ao carregar estabelecimento do storage:', e);
		}

		// Fallback para localStorage se não encontrou no storage
		if (storeName === 'Sua Loja') {
			storeName = localStorage.getItem('storeName') || storeName;
			storeNif = localStorage.getItem('storeNif') || storeNif;
			storeAddress = localStorage.getItem('storeAddress') || storeAddress;
			storePhone = localStorage.getItem('storePhone') || storePhone;
			storeEmail = localStorage.getItem('storeEmail') || storeEmail;
			storeLogo = localStorage.getItem('storeLogo') || '';
		} else {
			// Se encontrou no storage, ainda tenta pegar email e logo do localStorage
			storeEmail = localStorage.getItem('storeEmail') || storeEmail;
			if (!storeLogo) {
				storeLogo = localStorage.getItem('storeLogo') || '';
			}
		}

		// ========== CABEÇALHO COM LOGO E DADOS DO ESTABELECIMENTO ==========
		doc.setFillColor(240, 240, 240);
		doc.rect(0, 0, pageWidth, 50, 'F');
		
		// Logo à esquerda
		if (storeLogo) {
			try {
				const imgProps = doc.getImageProperties(storeLogo);
				const aspectRatio = imgProps.width / imgProps.height;
				const logoHeight = 30;
				const logoWidth = logoHeight * aspectRatio;
				if (logoWidth > 60) {
					const scale = 60 / logoWidth;
					doc.addImage(storeLogo, 'PNG', margin, 10, logoWidth * scale, logoHeight * scale);
				} else {
					doc.addImage(storeLogo, 'PNG', margin, 10, logoWidth, logoHeight);
				}
			} catch (e) {
				console.warn('Erro ao adicionar logo:', e);
			}
		}

		// Dados do estabelecimento à direita
		doc.setFontSize(16);
		doc.setFont('helvetica', 'bold');
		doc.setTextColor(30, 30, 30);
		doc.text(storeName, pageWidth - margin, 20, { align: 'right' });
		
		doc.setFontSize(9);
		doc.setFont('helvetica', 'normal');
		doc.setTextColor(60, 60, 60);
		doc.text(storeAddress, pageWidth - margin, 28, { align: 'right' });
		doc.text(`Tel: ${storePhone} | Email: ${storeEmail}`, pageWidth - margin, 33, { align: 'right' });
		doc.text(`NIF: ${storeNif}`, pageWidth - margin, 38, { align: 'right' });

		cursorY = 60;

		// ========== TÍTULO DO DOCUMENTO ==========
		const docTitle = title || (sale.type === 'invoice' ? 'FATURA' : sale.type === 'receipt' ? 'RECIBO' : 'FATURA-RECIBO');
		doc.setFontSize(24);
		doc.setFont('helvetica', 'bold');
		doc.setTextColor(30, 30, 30);
		doc.text(docTitle, margin, cursorY);
		
		// Número e data à direita
		doc.setFontSize(10);
		doc.setFont('helvetica', 'normal');
		doc.setTextColor(100, 100, 100);
		doc.text(`Nº: ${sale.number || sale.id}`, pageWidth - margin, cursorY - 5, { align: 'right' });
		doc.text(`Data: ${new Date(sale.date).toLocaleDateString('pt-AO', { day: '2-digit', month: '2-digit', year: 'numeric' })}`, pageWidth - margin, cursorY, { align: 'right' });
		
		cursorY += 15;

		// Linha divisória
		doc.setDrawColor(200, 200, 200);
		doc.setLineWidth(0.5);
		doc.line(margin, cursorY, pageWidth - margin, cursorY);
		cursorY += 10;

		// ========== DADOS DO CLIENTE ==========
		doc.setFontSize(11);
		doc.setFont('helvetica', 'bold');
		doc.setTextColor(30, 30, 30);
		doc.text('DADOS DO CLIENTE', margin, cursorY);
		cursorY += 7;

		doc.setFontSize(10);
		doc.setFont('helvetica', 'normal');
		doc.setTextColor(60, 60, 60);
		
		if (client && client.name && client.name !== 'Consumidor Final') {
			doc.text(`Nome: ${client.name}`, margin, cursorY);
			if (client.nif) {
				doc.text(`NIF: ${client.nif}`, margin + 80, cursorY);
			}
			cursorY += 6;
			if (client.address) {
				doc.text(`Endereço: ${client.address}`, margin, cursorY);
				cursorY += 6;
			}
			if (client.phone) {
				doc.text(`Telefone: ${client.phone}`, margin, cursorY);
				cursorY += 6;
			}
		} else {
			doc.text('Nome: Consumidor Final', margin, cursorY);
			cursorY += 6;
		}

		cursorY += 5;

		// Linha divisória
		doc.setDrawColor(200, 200, 200);
		doc.line(margin, cursorY, pageWidth - margin, cursorY);
		cursorY += 10;

	// ========== TABELA DE ITENS ==========
	const tableData = (sale.items || []).map(item => [
		item.productName,
		item.quantity.toString(),
		formatCurrency(item.price),
		formatCurrency(item.price * item.quantity),
	]);

		autoTable(doc, {
			startY: cursorY,
			head: [['Descrição', 'Qtd.', 'Preço Unit.', 'Total']],
			body: tableData,
			theme: 'striped',
			headStyles: { 
				fillColor: [2, 132, 199], 
				textColor: [255, 255, 255], 
				fontStyle: 'bold',
				fontSize: 10
			},
			bodyStyles: { 
				fontSize: 9,
				textColor: [30, 30, 30]
			},
			columnStyles: { 
				0: { cellWidth: 'auto', halign: 'left' },
				1: { halign: 'center', cellWidth: 20 },
				2: { halign: 'right', cellWidth: 40 },
				3: { halign: 'right', cellWidth: 40 }
			},
			margin: { left: margin, right: margin },
			styles: { cellPadding: 3 }
		});

		// @ts-ignore
		let finalY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 10 : cursorY + 10;

		// ========== TOTAIS ==========
		doc.setFontSize(12);
		doc.setFont('helvetica', 'bold');
		doc.setTextColor(30, 30, 30);
		doc.text('TOTAL:', pageWidth - margin - 50, finalY, { align: 'right' });
		doc.setFontSize(14);
		doc.text(formatCurrency(sale.total), pageWidth - margin, finalY, { align: 'right' });

		// Método de pagamento se disponível
		if (sale.paymentMethod) {
			finalY += 8;
			doc.setFontSize(9);
			doc.setFont('helvetica', 'normal');
			doc.setTextColor(100, 100, 100);
			doc.text(`Método de Pagamento: ${sale.paymentMethod}`, margin, finalY);
		}

		// Observações se disponível
		if (sale.observations) {
			finalY += 8;
			doc.setFontSize(9);
			doc.setFont('helvetica', 'italic');
			doc.setTextColor(100, 100, 100);
			doc.text(`Observações: ${sale.observations}`, margin, finalY);
		}

		// ========== RODAPÉ ==========
		const footerY = pageHeight - 15;
		doc.setDrawColor(200, 200, 200);
		doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
		doc.setFontSize(8);
		doc.setFont('helvetica', 'normal');
		doc.setTextColor(150, 150, 150);
		doc.text("Obrigado pela sua preferência!", pageWidth / 2, footerY, { align: 'center' });
		doc.text("Documento gerado por QR Sales Manager", pageWidth / 2, footerY + 4, { align: 'center' });

		// ========== QR CODE ÚNICO (opcional, não bloqueia PDF) ==========
		// Tentar adicionar QR code de forma rápida e não-bloqueante
		try {
			const qrData = JSON.stringify({
				type: sale.type,
				id: sale.id,
				number: sale.number || sale.id,
				date: sale.date,
				total: sale.total,
				store: storeName,
				client: client?.name || 'Consumidor Final'
			});

			const encodedData = encodeURIComponent(qrData);
			const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodedData}&format=png`;
			
			const img = new Image();
			img.crossOrigin = 'anonymous';
			
			// Tentar carregar QR code com timeout muito curto (500ms)
			await Promise.race([
				new Promise<void>((resolve, reject) => {
					img.onload = () => {
						try {
							const qrSize = 40;
							const qrX = pageWidth - margin - qrSize;
							const qrY = pageHeight - margin - qrSize - 20;
							doc.addImage(img, 'PNG', qrX, qrY, qrSize, qrSize);
							doc.setFontSize(7);
							doc.setFont('helvetica', 'normal');
							doc.setTextColor(150, 150, 150);
							doc.text('Código de Verificação', qrX + qrSize / 2, qrY + qrSize + 5, { align: 'center' });
							resolve();
						} catch (e) {
							reject(e);
						}
					};
					img.onerror = () => reject(new Error('QR load failed'));
					img.src = qrCodeUrl;
				}),
				new Promise<void>((_, reject) => setTimeout(() => reject(new Error('QR timeout')), 500))
			]);
		} catch (qrError) {
			// QR code é opcional - continuar sem ele
			console.debug('QR code não adicionado (opcional):', qrError);
		}

	// ========== SALVAR PDF ==========
	const kind = sale.type === 'invoice' ? 'Fatura' : sale.type === 'receipt' ? 'Recibo' : 'Fatura-Recibo';
	const fileName = `${kind}_${sale.number || sale.id}_${new Date(sale.date).toISOString().split('T')[0]}.pdf`;
	
	// MOBILE: Usar Filesystem + Share
	if (Capacitor.isNativePlatform()) {
		try {
			console.log('📱 Mobile: Gerando PDF...');
			const pdfBase64 = doc.output('dataurlstring').split(',')[1]; // Remove "data:application/pdf;base64,"
			
			// Salvar no diretório de cache
			const result = await Filesystem.writeFile({
				path: fileName,
				data: pdfBase64,
				directory: Directory.Cache
			});
			
			console.log('✅ PDF salvo em:', result.uri);
			
			// Compartilhar PDF
			await Share.share({
				title: fileName,
				text: `${kind} - ${sale.number || sale.id}`,
				url: result.uri,
				dialogTitle: 'Partilhar PDF'
			});
			
			console.log('✅ PDF compartilhado com sucesso!');
			return;
		} catch (mobileError: any) {
			console.error('❌ Erro ao salvar PDF no mobile:', mobileError);
			alert(`Erro ao gerar PDF: ${mobileError.message || 'Erro desconhecido'}`);
			throw mobileError;
		}
	}
	
	// WEB: Usar download normal
	try {
		console.log('💻 Web: Gerando PDF...');
		doc.save(fileName);
		console.log('✅ PDF gerado e baixado com sucesso:', fileName);
	} catch (saveError: any) {
			console.warn('⚠️ Erro ao salvar PDF com doc.save(), tentando método alternativo:', saveError);
			// Método alternativo: criar link de download
			try {
				const pdfBlob = doc.output('blob');
				const url = URL.createObjectURL(pdfBlob);
				const link = document.createElement('a');
				link.href = url;
				link.download = fileName;
				link.style.display = 'none';
				document.body.appendChild(link);
				link.click();
				// Limpar após um tempo
				setTimeout(() => {
					document.body.removeChild(link);
					URL.revokeObjectURL(url);
				}, 100);
				console.log('✅ PDF baixado via método alternativo (blob):', fileName);
			} catch (altError: any) {
				console.error('❌ Erro ao baixar PDF (método alternativo):', altError);
				// Último recurso: tentar abrir em nova aba
				try {
					const pdfDataUri = doc.output('datauristring');
					const newWindow = window.open();
					if (newWindow) {
						newWindow.document.write(`<iframe width="100%" height="100%" src="${pdfDataUri}"></iframe>`);
					} else {
						throw new Error('Popup bloqueado');
					}
				} catch (finalError: any) {
					const errorMsg = `Não foi possível baixar o PDF. Erro: ${finalError?.message || 'Desconhecido'}. Verifique as permissões do navegador ou bloqueadores de popup.`;
					console.error('❌', errorMsg);
					alert(errorMsg);
					throw new Error(errorMsg);
				}
			}
		}
	} catch (error) {
		console.error('Erro ao gerar PDF:', error);
		alert(`Erro ao gerar PDF: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
		throw error;
	}
}


