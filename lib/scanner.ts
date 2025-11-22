import { Html5Qrcode } from 'html5-qrcode';

export async function requestCameraPermission(): Promise<boolean> {
	// Browser/WebView permission will be prompted by getUserMedia under the hood
	return true;
}

export async function startScan(elementId: string = 'qr-reader'): Promise<string | null> {
	const hasPerm = await requestCameraPermission();
	if (!hasPerm) return null;
	const html5Qrcode = new Html5Qrcode(elementId);
	return new Promise(async (resolve, reject) => {
		try {
			await html5Qrcode.start(
				{ facingMode: 'environment' },
				{ fps: 10, qrbox: 250 },
				(decodedText) => {
					html5Qrcode.stop().finally(() => {
						resolve(decodedText);
					});
				},
				/* onDecodeError */ () => {}
			);
		} catch (e) {
			try { await html5Qrcode.stop(); } catch {}
			reject(e);
		}
	});
}


