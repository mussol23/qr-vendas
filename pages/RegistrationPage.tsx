import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import { ChevronLeftIcon } from '../components/Icons';
import { supabase } from '../lib/supabase';
import Spinner from '../components/Spinner';

// A simple stepper component
const Stepper = ({ currentStep }: { currentStep: number }) => {
    const steps = ['Usuário', 'Loja', 'Senha'];
    return (
        <div className="flex items-center justify-between mb-8">
            {steps.map((step, index) => (
                <React.Fragment key={index}>
                    <div className="flex items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${currentStep >= index + 1
                                ? 'bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-lg scale-110'
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                            }`}>
                            {currentStep > index + 1 ? (
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            ) : (
                                index + 1
                            )}
                        </div>
                        <p className={`ml-2 text-sm font-medium hidden sm:block transition-colors ${currentStep >= index + 1
                                ? 'text-brand-600 dark:text-brand-400'
                                : 'text-gray-500 dark:text-gray-400'
                            }`}>
                            {step}
                        </p>
                    </div>
                    {index < steps.length - 1 && (
                        <div className="flex-1 h-1 bg-gray-200 dark:bg-gray-700 mx-2 sm:mx-4 rounded-full overflow-hidden">
                            <div
                                className={`h-full bg-gradient-to-r from-brand-600 to-brand-500 transition-all duration-500 ${currentStep > index + 1 ? 'w-full' : 'w-0'
                                    }`}
                            />
                        </div>
                    )}
                </React.Fragment>
            ))}
        </div>
    );
};

const RegistrationPage: React.FC = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
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

    const handleGoogleSignup = async () => {
        setGoogleLoading(true);

        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/pos`,
            },
        });

        if (error) {
            alert(`Erro ao cadastrar com Google: ${error.message}`);
            setGoogleLoading(false);
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
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-brand-950 p-4">
            <div className="w-full max-w-2xl">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 sm:p-8 relative">
                    {/* Back Button */}
                    <button
                        onClick={() => navigate(-1)}
                        className="absolute left-4 top-4 p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors z-10"
                        aria-label="Voltar"
                    >
                        <ChevronLeftIcon className="h-6 w-6" />
                    </button>

                    {/* Header */}
                    <div className="text-center mb-6 mt-4">
                        <div className="flex items-center justify-center gap-3 mb-3">
                            <QRCodeCanvas
                                value="QRSales"
                                size={48}
                                bgColor="transparent"
                                fgColor={document.documentElement.classList.contains('dark') ? '#38bdf8' : '#0284c7'}
                            />
                            <h2 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-brand-600 to-brand-400 bg-clip-text text-transparent">
                                Vendas
                            </h2>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Crie sua conta e comece a gerenciar sua loja
                        </p>
                    </div>

                    {/* Google Signup Button - Only show on step 1 */}
                    {step === 1 && (
                        <>
                            <button
                                onClick={handleGoogleSignup}
                                disabled={googleLoading || isLoading}
                                className="w-full mb-6 py-3 px-4 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-medium rounded-lg shadow-sm hover:shadow-md hover:border-gray-400 dark:hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-3"
                            >
                                {googleLoading ? (
                                    <Spinner size="sm" />
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                                            <path
                                                fill="#4285F4"
                                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                            />
                                            <path
                                                fill="#34A853"
                                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                            />
                                            <path
                                                fill="#FBBC05"
                                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                            />
                                            <path
                                                fill="#EA4335"
                                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                            />
                                        </svg>
                                        <span>Cadastrar com Google</span>
                                    </>
                                )}
                            </button>

                            {/* Divider */}
                            <div className="relative mb-6">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-4 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                                        Ou preencha os dados
                                    </span>
                                </div>
                            </div>
                        </>
                    )}

                    <Stepper currentStep={step} />

                    <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
                        {step === 1 && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white text-center mb-6">Dados do Usuário</h3>
                                <div className="relative">
                                    <input
                                        name="userName"
                                        type="text"
                                        required
                                        value={formData.userName}
                                        onChange={handleChange}
                                        className="peer w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-brand-500 dark:focus:border-brand-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors placeholder-transparent"
                                        placeholder="Nome Completo"
                                    />
                                    <label className="absolute left-3 -top-2.5 bg-white dark:bg-gray-700 px-1 text-sm text-gray-600 dark:text-gray-400 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-3 peer-placeholder-shown:text-gray-400 peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-brand-600 dark:peer-focus:text-brand-400">
                                        Nome Completo
                                    </label>
                                </div>
                                <div className="relative">
                                    <input
                                        name="userEmail"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        value={formData.userEmail}
                                        onChange={handleChange}
                                        className="peer w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-brand-500 dark:focus:border-brand-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors placeholder-transparent"
                                        placeholder="Email"
                                    />
                                    <label className="absolute left-3 -top-2.5 bg-white dark:bg-gray-700 px-1 text-sm text-gray-600 dark:text-gray-400 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-3 peer-placeholder-shown:text-gray-400 peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-brand-600 dark:peer-focus:text-brand-400">
                                        Email
                                    </label>
                                </div>
                                <div className="relative">
                                    <input
                                        name="userPhone"
                                        type="tel"
                                        required
                                        value={formData.userPhone}
                                        onChange={handleChange}
                                        className="peer w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-brand-500 dark:focus:border-brand-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors placeholder-transparent"
                                        placeholder="Telefone"
                                    />
                                    <label className="absolute left-3 -top-2.5 bg-white dark:bg-gray-700 px-1 text-sm text-gray-600 dark:text-gray-400 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-3 peer-placeholder-shown:text-gray-400 peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-brand-600 dark:peer-focus:text-brand-400">
                                        Telefone
                                    </label>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white text-center mb-6">Dados da Loja</h3>
                                <div className="relative">
                                    <input
                                        name="storeName"
                                        type="text"
                                        required
                                        value={formData.storeName}
                                        onChange={handleChange}
                                        className="peer w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-brand-500 dark:focus:border-brand-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors placeholder-transparent"
                                        placeholder="Nome da Loja"
                                    />
                                    <label className="absolute left-3 -top-2.5 bg-white dark:bg-gray-700 px-1 text-sm text-gray-600 dark:text-gray-400 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-3 peer-placeholder-shown:text-gray-400 peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-brand-600 dark:peer-focus:text-brand-400">
                                        Nome da Loja
                                    </label>
                                </div>
                                <div className="relative">
                                    <input
                                        name="storeNif"
                                        type="text"
                                        required
                                        value={formData.storeNif}
                                        onChange={handleChange}
                                        className="peer w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-brand-500 dark:focus:border-brand-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors placeholder-transparent"
                                        placeholder="NIF da Loja"
                                    />
                                    <label className="absolute left-3 -top-2.5 bg-white dark:bg-gray-700 px-1 text-sm text-gray-600 dark:text-gray-400 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-3 peer-placeholder-shown:text-gray-400 peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-brand-600 dark:peer-focus:text-brand-400">
                                        NIF da Loja
                                    </label>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white text-center mb-6">Crie sua Senha</h3>
                                <div className="relative">
                                    <input
                                        name="password"
                                        type="password"
                                        required
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="peer w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-brand-500 dark:focus:border-brand-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors placeholder-transparent"
                                        placeholder="Senha"
                                    />
                                    <label className="absolute left-3 -top-2.5 bg-white dark:bg-gray-700 px-1 text-sm text-gray-600 dark:text-gray-400 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-3 peer-placeholder-shown:text-gray-400 peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-brand-600 dark:peer-focus:text-brand-400">
                                        Senha (mínimo 6 caracteres)
                                    </label>
                                </div>
                                <div className="relative">
                                    <input
                                        name="confirmPassword"
                                        type="password"
                                        required
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        className="peer w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-brand-500 dark:focus:border-brand-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors placeholder-transparent"
                                        placeholder="Confirmar Senha"
                                    />
                                    <label className="absolute left-3 -top-2.5 bg-white dark:bg-gray-700 px-1 text-sm text-gray-600 dark:text-gray-400 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-3 peer-placeholder-shown:text-gray-400 peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-brand-600 dark:peer-focus:text-brand-400">
                                        Confirmar Senha
                                    </label>
                                </div>
                            </div>
                        )}

                        <div className="flex items-center justify-between mt-8 gap-4">
                            {step > 1 ? (
                                <button
                                    type="button"
                                    onClick={handleBack}
                                    className="flex items-center gap-2 py-3 px-6 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-all"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                    Voltar
                                </button>
                            ) : <div></div>}

                            {step < 3 ? (
                                <button
                                    type="button"
                                    onClick={handleNext}
                                    className="flex items-center gap-2 py-3 px-6 bg-gradient-to-r from-brand-600 to-brand-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl hover:from-brand-700 hover:to-brand-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    Próximo
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="flex items-center justify-center gap-3 py-3 px-8 bg-gradient-to-r from-green-600 to-green-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl hover:from-green-700 hover:to-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:transform-none"
                                >
                                    {isLoading ? (
                                        <>
                                            <Spinner size="sm" color="white" />
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

                    <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
                        Já tem uma conta?{' '}
                        <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-500 dark:text-brand-400 dark:hover:text-brand-300 transition-colors">
                            Faça login
                        </Link>
                    </p>
                </div>

                {/* Footer Note */}
                <p className="mt-6 text-center text-xs text-gray-500 dark:text-gray-500">
                    Ao criar uma conta, você concorda com nossos Termos de Serviço e Política de Privacidade
                </p>
            </div>
        </div>
    );
};

export default RegistrationPage;