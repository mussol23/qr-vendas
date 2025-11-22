

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CubeIcon, ShoppingCartIcon, WhatsAppIcon, EnvelopeIcon, FacebookIcon, InstagramIcon } from '../components/Icons';
import { QRCodeCanvas } from 'qrcode.react';

const LandingPage: React.FC = () => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

    useEffect(() => {
        const slideInterval = setInterval(() => {
            setCurrentSlide(prevSlide => (prevSlide + 1) % 3); // 3 slides
        }, 5000);

        const observer = new MutationObserver(() => {
            setIsDark(document.documentElement.classList.contains('dark'));
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

        return () => {
            clearInterval(slideInterval);
            observer.disconnect();
        };
    }, []);

    const carouselSlides = [
        {
            icon: <ShoppingCartIcon />,
            title: "Ponto de Venda Moderno",
            description: "Um POS intuitivo para otimizar o seu fluxo de caixa e melhorar a experiência do cliente."
        },
        {
            icon: <CubeIcon />,
            title: "Gestão de Stock Inteligente",
            description: "Mantenha o inventário atualizado em tempo real, receba alertas de stock baixo e evite perdas."
        },
        {
            icon: <QRCodeCanvas value="QRSales" size={128} bgColor="transparent" fgColor={isDark ? '#38bdf8' : '#0284c7'} />,
            title: "Vendas Rápidas com QR Code",
            description: "Gere etiquetas QR e use o scanner da câmera para adicionar produtos ao carrinho instantaneamente."
        }
    ];

    return (
        <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
            {/* Header */}
            <header className="absolute top-0 left-0 right-0 z-10 p-4">
                <div className="container mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <QRCodeCanvas value="QRSales" size={32} bgColor="transparent" fgColor={isDark ? '#38bdf8' : '#0284c7'} />
                        <h1 className="text-2xl font-bold text-brand-600 dark:text-brand-400">Vendas</h1>
                    </div>
                    <nav className="flex items-center gap-4">
                        <Link to="/login" className="font-semibold text-brand-600 dark:text-brand-400 hover:underline">
                            Login
                        </Link>
                        <Link to="/register" className="px-4 py-2 bg-brand-600 text-white font-semibold rounded-lg shadow hover:bg-brand-700">
                            Cadastro
                        </Link>
                    </nav>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex items-center justify-center">
                <div className="container mx-auto px-4 py-10">
                    <div className="relative h-[32rem] overflow-hidden">
                        {carouselSlides.map((slide, index) => (
                            <div
                                key={index}
                                className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}
                            >
                                <div className="h-full flex flex-col items-center justify-center text-center gap-8">
                                    <div className="space-y-6">
                                        <div className="inline-block text-brand-600 dark:text-brand-400">
                                            {
                                                React.isValidElement(slide.icon) && slide.icon.type !== QRCodeCanvas ?
                                                // FIX: Cast slide.icon to React.ReactElement<any> to inform TypeScript that it can accept any props, resolving the error with passing 'className'.
                                                React.cloneElement(slide.icon as React.ReactElement<any>, { className: "h-32 w-32 mx-auto" }) :
                                                slide.icon
                                            }
                                        </div>
                                        <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white">{slide.title}</h2>
                                        <p className="max-w-xl mx-auto text-lg text-gray-600 dark:text-gray-300">{slide.description}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-center mt-8 space-x-3">
                        {carouselSlides.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentSlide(index)}
                                className={`h-3 w-3 rounded-full transition-colors ${index === currentSlide ? 'bg-brand-600' : 'bg-gray-300 dark:bg-gray-600'}`}
                                aria-label={`Go to slide ${index + 1}`}
                            />
                        ))}
                    </div>
                </div>
            </main>
            
            {/* Footer */}
            <footer className="py-6 bg-white dark:bg-gray-800 border-t dark:border-gray-700">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row justify-between items-center text-center md:text-left">
                        <div className="mb-4 md:mb-0">
                             <p className="text-sm text-gray-500">&copy; {new Date().getFullYear()} QR Vendas. Todos os direitos reservados.</p>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="font-semibold text-gray-700 dark:text-gray-300">942 775 559</span>
                            <div className="flex space-x-3 text-gray-500 dark:text-gray-400">
                                <a href="#" className="hover:text-brand-500"><WhatsAppIcon className="h-5 w-5"/></a>
                                <a href="#" className="hover:text-brand-500"><EnvelopeIcon className="h-5 w-5"/></a>
                                <a href="#" className="hover:text-brand-500"><FacebookIcon className="h-5 w-5"/></a>
                                <a href="#" className="hover:text-brand-500"><InstagramIcon className="h-5 w-5"/></a>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;