import jsPDF from 'jspdf';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

export type PdfContentBlock = {
	type: 'text';
	text: string;
	x?: number;
	y?: number;
	size?: number;
	bold?: boolean;
};

export async function generateAndSavePdf(blocks: PdfContentBlock[], fileName = 'documento.pdf'): Promise<string> {
	const doc = new jsPDF();
	let cursorY = 20;
	blocks.forEach((b) => {
		if (b.type === 'text') {
			if (b.bold) doc.setFont(undefined, 'bold');
			if (b.size) doc.setFontSize(b.size);
			doc.text(b.text, b.x ?? 20, b.y ?? cursorY);
			doc.setFont(undefined, 'normal');
			doc.setFontSize(12);
			cursorY += 8;
		}
	});

	if (!Capacitor.isNativePlatform()) {
		// Web: trigger download
		doc.save(fileName);
		return fileName;
	}

	// Mobile: write to Filesystem and share
	const pdfBase64 = doc.output('datauristring').split(',')[1];
	const path = `Documents/${fileName}`;
	await Filesystem.writeFile({
		path,
		data: pdfBase64,
		directory: Directory.Documents,
	});
	try {
		await Share.share({
			title: fileName,
			text: 'PDF gerado',
			url: '',
			dialogTitle: 'Compartilhar PDF',
		});
	} catch (_) {
		// ignore if user cancels
	}
	return path;
}


