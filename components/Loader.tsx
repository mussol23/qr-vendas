import React from 'react';
import Spinner from './Spinner';

type LoaderProps = {
	fullscreen?: boolean;
	label?: string;
	showProgress?: boolean;
};

const Loader: React.FC<LoaderProps> = ({ fullscreen = false, label = 'Carregando...', showProgress = true }) => {
	const content = (
		<div className="flex flex-col items-center gap-4 px-6 py-5 rounded-xl bg-white/90 dark:bg-gray-900/90 shadow-xl backdrop-blur-sm border border-gray-200/20 dark:border-gray-700/20">
			{/* Spinner profissional */}
			<Spinner size="lg" />
			
			{/* Label */}
			<span className="text-sm font-medium text-gray-800 dark:text-gray-200">{label}</span>
			
			{/* Barra de progresso animada (opcional) */}
			{showProgress && (
				<div className="w-48 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
					<div 
						className="h-full bg-gradient-to-r from-brand-500 via-brand-600 to-brand-500 animate-[shimmer_1.5s_infinite]"
						style={{ width: '40%', backgroundSize: '200% 100%' }}
					/>
				</div>
			)}
		</div>
	);
	
	if (!fullscreen) return content;
	
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-gray-50/80 via-white/80 to-gray-100/80 dark:from-gray-900/80 dark:via-gray-800/80 dark:to-gray-900/80 backdrop-blur-sm">
			{content}
		</div>
	);
};

export default Loader;


