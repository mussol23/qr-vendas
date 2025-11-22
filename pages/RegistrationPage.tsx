import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import { ChevronLeftIcon } from '../components/Icons';
import { supabase } from '../lib/supabase';
import { apiPost } from '../lib/api';
import Spinner from '../components/Spinner';

// A simple stepper component
const Stepper = ({ currentStep }: { currentStep: number }) => {
    const steps = ['Usuário', 'Loja', 'Senha'];
    return (
        <div className="flex items-center justify-between mb-8">
            {steps.map((step, index) => (
                <React.Fragment key={index}>
                    <div className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${currentStep >= index + 1 ? 'bg-brand-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}>
                            {index + 1}
                        </div>
                        <p className={`ml-2 text-sm font-medium ${currentStep >= index + 1 ? 'text-brand-600 dark:text-brand-400' : 'text-gray-500'}`}>
                            {step}
                        </p>
                    </div>
                    {index < steps.length - 1 && <div className="flex-1 h-0.5 bg-gray-200 dark:bg-gray-700 mx-4"></div>}
                </React.Fragment>
            ))}
        </div>
    );
};

const RegistrationPage: React.FC = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        userName: '',
        userEmail: '',
        userPhone: '',
        storeName: '',
        storeNif: '',
        password: '',
        confirmPassword: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleNext = () => {
        // Add validation logic here if needed
        if (step < 3) {
            setStep(prev => prev + 1);
        }
    };

    const handleBack = () => {
        if (step > 1) {
            setStep(prev => prev - 1);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validação
        if (formData.password !== formData.confirmPassword) {
            alert("As senhas não coincidem.");
            return;
        }
        
        if (formData.password.length < 6) {
            alert("A senha deve ter pelo menos 6 caracteres.");
            return;
        }
        
        setIsLoading(true);
        
        try {
            console.log('📝 Registro: Criando conta de usuário...');
            
            // 1. Apenas cria o usuário no Supabase.
            const { error: signUpErr } = await supabase.auth.signUp({
                email: formData.userEmail,
                password: formData.password,
                options: {
                    data: {
                        full_name: formData.userName,
                        phone: formData.userPhone,
                    }
                }
            });
            
            if (signUpErr) {
                alert(`Erro ao criar conta: ${signUpErr.message}`);
                setIsLoading(false);
                return;
            }
            
            console.log('✅ Registro: Conta criada. Redirecionando para página de sucesso...');

            // 2. Redireciona diretamente para a página de sucesso.
            navigate('/success', { replace: true });
            
        } catch (error: any) {
            console.error('❌ Registro: Erro geral:', error);
            alert(`Erro ao criar conta: ${error.message || 'Erro desconhecido'}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
            <div className="w-full max-w-lg p-8 space-y-8 bg-white dark:bg-gray-800 rounded-lg shadow-md relative">
                <button onClick={() => navigate(-1)} className="absolute left-4 top-4 p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700" aria-label="Voltar">
                    <ChevronLeftIcon className="h-6 w-6" />
                </button>
                <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <QRCodeCanvas value="QRSales" size={48} bgColor="transparent" fgColor={document.documentElement.classList.contains('dark') ? '#38bdf8' : '#0284c7'} />
                        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">
                            Vendas
                        </h2>
                    </div>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        Crie sua conta para começar a gerenciar sua loja
                    </p>
                </div>
                
                <Stepper currentStep={step} />

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {step === 1 && (
                        <div className="rounded-md shadow-sm -space-y-px">
                            <h3 className="text-lg font-medium mb-4 text-center">Dados do Usuário</h3>
                            <div>
                                <input name="userName" type="text" required value={formData.userName} onChange={handleChange} className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-brand-500 focus:border-brand-500 focus:z-10 sm:text-sm bg-white dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white" placeholder="Nome Completo" />
                            </div>
                            <div>
                                <input name="userEmail" type="email" autoComplete="email" required value={formData.userEmail} onChange={handleChange} className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-brand-500 focus:border-brand-500 focus:z-10 sm:text-sm bg-white dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white" placeholder="Email" />
                            </div>
                             <div>
                                <input name="userPhone" type="tel" required value={formData.userPhone} onChange={handleChange} className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-brand-500 focus:border-brand-500 focus:z-10 sm:text-sm bg-white dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white" placeholder="Telefone" />
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="rounded-md shadow-sm -space-y-px">
                            <h3 className="text-lg font-medium mb-4 text-center">Dados da Loja</h3>
                            <div>
                                <input name="storeName" type="text" required value={formData.storeName} onChange={handleChange} className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-brand-500 focus:border-brand-500 focus:z-10 sm:text-sm bg-white dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white" placeholder="Nome da Loja" />
                            </div>
                            <div>
                                <input name="storeNif" type="text" required value={formData.storeNif} onChange={handleChange} className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-brand-500 focus:border-brand-500 focus:z-10 sm:text-sm bg-white dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white" placeholder="NIF da Loja" />
                            </div>
                        </div>
                    )}
                    
                    {step === 3 && (
                         <div className="rounded-md shadow-sm -space-y-px">
                            <h3 className="text-lg font-medium mb-4 text-center">Crie sua Senha</h3>
                            <div>
                                <input name="password" type="password" required value={formData.password} onChange={handleChange} className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-brand-500 focus:border-brand-500 focus:z-10 sm:text-sm bg-white dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white" placeholder="Senha" />
                            </div>
                            <div>
                                <input name="confirmPassword" type="password" required value={formData.confirmPassword} onChange={handleChange} className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-brand-500 focus:border-brand-500 focus:z-10 sm:text-sm bg-white dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white" placeholder="Confirmar Senha" />
                            </div>
                        </div>
                    )}

                    <div className="flex items-center justify-between mt-6">
                        {step > 1 ? (
                             <button type="button" onClick={handleBack} className="group relative flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-brand-700 bg-brand-100 hover:bg-brand-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500">
                                Voltar
                            </button>
                        ) : <div></div>} {/* Placeholder to keep "Next" on the right */}

                        {step < 3 ? (
                             <button type="button" onClick={handleNext} className="group relative flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500">
                                Próximo
                            </button>
                        ) : (
                            <button 
                                type="submit" 
                                disabled={isLoading}
                                className="group relative flex items-center justify-center gap-3 py-3 px-8 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none disabled:hover:scale-100"
                            >
                                {isLoading ? (
                                    <>
                                        {/* Spinner profissional com bolinhas brancas */}
                                        <div className="relative">
                                            <Spinner size="sm" color="white" />
                                        </div>
                                        <span className="animate-pulse">Criando conta...</span>
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span>Criar Conta</span>
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </form>
                <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
                    Já tem uma conta?{' '}
                    <Link to="/login" className="font-medium text-brand-600 hover:text-brand-500 dark:text-brand-400">
                        Faça login
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default RegistrationPage;