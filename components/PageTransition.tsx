import React, { useEffect, useMemo, useRef, useState } from 'react';

const PageTransition: React.FC<React.PropsWithChildren<{ id: string }>> = ({ id, children }) => {
	const currentView = useMemo(() => <div key={`view-${id}`}>{children}</div>, [id, children]);
	const [prevChild, setPrevChild] = useState<React.ReactNode | null>(null);
	const [prevFading, setPrevFading] = useState(false);
	const [fadeIn, setFadeIn] = useState(false);
	const prevIdRef = useRef<string | null>(null);
	const lastViewRef = useRef<React.ReactNode>(currentView); // holds previous render's view

	useEffect(() => {
		// On id change, use the last rendered view for the outgoing layer
		if (prevIdRef.current && prevIdRef.current !== id) {
			setPrevChild(lastViewRef.current);
			setPrevFading(false);
			requestAnimationFrame(() => setPrevFading(true));
		}
		prevIdRef.current = id;
		// Start incoming fade
		setFadeIn(false);
		const t = requestAnimationFrame(() => setFadeIn(true));
		const clearPrev = setTimeout(() => {
			setPrevChild(null);
			setPrevFading(false);
		}, 500);
		// Update last view AFTER we've captured it for prevChild
		lastViewRef.current = currentView;
		return () => {
			cancelAnimationFrame(t);
			clearTimeout(clearPrev);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [id, currentView]);

	return (
		<div className="relative">
			{prevChild && (
				<div className={`absolute inset-0 transition-opacity duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-[opacity] ${prevFading ? 'opacity-0' : 'opacity-100'} pointer-events-none`}>
					{prevChild}
				</div>
			)}
			<div
				key={id}
				className={`transition-opacity duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-[opacity] ${fadeIn ? 'opacity-100' : 'opacity-0'}`}
			>
				{currentView}
			</div>
		</div>
	);
};

export default PageTransition;


