import React, { useEffect, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import Spinner from './Spinner';

type SplashScreenProps = {
  onComplete?: () => void;
  duration?: number; // em milissegundos
};

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete, duration = 5000 }) => {
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Animar progresso
    const interval = 50; // atualizar a cada 50ms
    const steps = duration / interval;
    const increment = 100 / steps;
    
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= 100) {
        current = 100;
        clearInterval(timer);
        // Iniciar fade out
        setTimeout(() => {
          setFadeOut(true);
          // Chamar callback após fade out
          setTimeout(() => {
            onComplete?.();
          }, 500);
        }, 200);
      }
      setProgress(current);
    }, interval);

    return () => clearInterval(timer);
  }, [duration, onComplete]);

  return (
    <div 
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-br from-brand-50 via-white to-brand-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}
    >
      {/* Logo e Nome */}
      <div className="flex flex-col items-center gap-6 mb-12">
        {/* QR Code Logo com animação */}
        <div className="relative">
          {/* Círculo de fundo pulsante */}
          <div className="absolute inset-0 -m-4 rounded-full bg-brand-500/10 dark:bg-brand-400/10 animate-pulse" />
          <div className="absolute inset-0 -m-2 rounded-full bg-brand-500/5 dark:bg-brand-400/5 animate-pulse" style={{ animationDelay: '0.3s' }} />
          
          {/* Logo QR */}
          <div className="relative z-10 p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-xl">
            <QRCodeCanvas 
              value="QR Vendas" 
              size={120} 
              bgColor="transparent" 
              fgColor={document.documentElement.classList.contains('dark') ? '#38bdf8' : '#0284c7'}
              level="H"
              imageSettings={{
                src: '',
                height: 0,
                width: 0,
                excavate: false,
              }}
            />
          </div>
        </div>

        {/* Nome da App */}
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-2">
            QR <span className="text-brand-600 dark:text-brand-400">Vendas</span>
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
            Sistema de Gestão Comercial
          </p>
        </div>
      </div>

      {/* Spinner e Progresso */}
      <div className="flex flex-col items-center gap-6">
        {/* Spinner profissional */}
        <Spinner size="xl" />

        {/* Texto de Loading */}
        <div className="text-center">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            A preparar aplicação...
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {Math.round(progress)}%
          </p>
        </div>

        {/* Barra de Progresso */}
        <div className="w-64 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
          <div 
            className="h-full bg-gradient-to-r from-brand-500 via-brand-600 to-brand-500 rounded-full transition-all duration-300 ease-out shadow-lg"
            style={{ 
              width: `${progress}%`,
              backgroundSize: '200% 100%',
              animation: 'shimmer 2s linear infinite'
            }}
          />
        </div>
      </div>

      {/* Versão no rodapé */}
      <div className="absolute bottom-8 text-center">
        <p className="text-xs text-gray-400 dark:text-gray-600">
          Versão 1.0.0
        </p>
      </div>

      <style>{`
        @keyframes shimmer {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;

