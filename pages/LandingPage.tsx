

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
                        <div className="flex items-center space-x-3 text-gray-500 dark:text-gray-400">
                            <a
                                href="tel:942775559"
                                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-brand-500 transition-all"
                                title="Ligar: 942 775 559"
                            >
                                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                            </a>
                            <a
                                href="https://wa.me/351942775559"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-green-500 transition-all"
                                title="WhatsApp"
                            >
                                <WhatsAppIcon className="h-6 w-6" />
                            </a>
                            <a
                                href="mailto:contato@qrvendas.com"
                                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-brand-500 transition-all"
                                title="Email"
                            >
                                <EnvelopeIcon className="h-6 w-6" />
                            </a>
                            <a
                                href="#"
                                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-blue-500 transition-all"
                                title="Facebook"
                            >
                                <FacebookIcon className="h-6 w-6" />
                            </a>
                            <a
                                href="#"
                                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-pink-500 transition-all"
                                title="Instagram"
                            >
                                <InstagramIcon className="h-6 w-6" />
                            </a>
                        </div>
                    </div>

                    {/* Links para download do app - apenas em tablets e desktop */}
                    <div className="hidden md:block border-t dark:border-gray-700 mt-4 pt-4">
                        <div className="flex flex-row items-center justify-center gap-3">
                            <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Baixe o app:</span>
                            <div className="flex gap-3">
                                <a
                                    href="https://apps.apple.com/app/qr-vendas"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-3 py-1.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-xs"
                                >
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.1 22C7.79 22.05 6.8 20.68 5.96 19.47C4.25 17 2.94 12.45 4.7 9.39C5.57 7.87 7.13 6.91 8.82 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5M13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z" />
                                    </svg>
                                    <span>App Store</span>
                                </a>
                                <a
                                    href="https://play.google.com/store/apps/details?id=com.qrvendas.app"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-3 py-1.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-xs"
                                >
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
                                    </svg>
                                    <span>Google Play</span>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;