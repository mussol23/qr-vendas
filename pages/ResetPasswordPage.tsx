import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import { supabase } from '../lib/supabase';
import Loader from '../components/Loader';

const ResetPasswordPage: React.FC = () => {
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [validatingToken, setValidatingToken] = useState(true);

    useEffect(() => {
        // Verifica se há uma sessão de recuperação válida
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                setError('Link de recuperação inválido ou expirado.');
                setValidatingToken(false);
                setTimeout(() => navigate('/forgot-password'), 3000);
                return;
            }

            setValidatingToken(false);
        };

        checkSession();
    }, [navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validações
        if (password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres.');
            return;
        }

        if (password !== confirmPassword) {
            setError('As senhas não coincidem.');
            return;
        }

        setLoading(true);

        try {
            // Atualiza a senha do usuário
            const { error } = await supabase.auth.updateUser({
                password: password,
            });

            if (error) {
                setError(error.message);
            } else {
                // Sucesso! Redireciona para o login
                alert('Senha redefinida com sucesso! Faça login com sua nova senha.');
                navigate('/login');
            }
        } catch (err: any) {
            setError(err.message || 'Ocorreu um erro ao redefinir a senha.');
        } finally {
            setLoading(false);
        }
    };

    if (validatingToken) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-brand-950">
                <Loader label="Validando link de recuperação..." />
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-brand-950 p-4">
            <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <QRCodeCanvas
                            value="QRSales"
                            size={48}
                            bgColor="transparent"
                            fgColor={document.documentElement.classList.contains('dark') ? '#38bdf8' : '#0284c7'}
                        />
                        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">
                            Vendas
                        </h2>
                    </div>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        Defina sua nova senha
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div className="relative">
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="new-password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="peer h-10 w-full border-b-2 border-gray-300 bg-transparent text-gray-900 placeholder-transparent focus:outline-none focus:border-brand-600 dark:bg-transparent dark:border-gray-600 dark:text-white dark:focus:border-brand-400"
                                placeholder="Nova Senha"
                            />
                            <label
                                htmlFor="password"
                                className="absolute left-0 -top-3.5 text-gray-600 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-2 peer-focus:-top-3.5 peer-focus:text-gray-600 peer-focus:text-sm dark:text-gray-400 dark:peer-focus:text-gray-400"
                            >
                                Nova Senha
                            </label>
                        </div>

                        <div className="relative">
                            <input
                                id="confirm-password"
                                name="confirm-password"
                                type="password"
                                autoComplete="new-password"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="peer h-10 w-full border-b-2 border-gray-300 bg-transparent text-gray-900 placeholder-transparent focus:outline-none focus:border-brand-600 dark:bg-transparent dark:border-gray-600 dark:text-white dark:focus:border-brand-400"
                                placeholder="Confirmar Senha"
                            />
                            <label
                                htmlFor="confirm-password"
                                className="absolute left-0 -top-3.5 text-gray-600 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-2 peer-focus:-top-3.5 peer-focus:text-gray-600 peer-focus:text-sm dark:text-gray-400 dark:peer-focus:text-gray-400"
                            >
                                Confirmar Senha
                            </label>
                        </div>
                    </div>

                    {error && (
                        <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                                        {error}
                                    </h3>
                                </div>
                            </div>
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 px-4 bg-brand-600 text-white font-medium rounded-lg shadow-md hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Redefinindo...' : 'Redefinir Senha'}
                        </button>
                    </div>
                </form>

                {loading && <div className="flex justify-center"><Loader /></div>}
            </div>
        </div>
    );
};

export default ResetPasswordPage;
