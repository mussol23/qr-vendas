import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import { useAuth } from '../context/AuthContext';
import { ChevronLeftIcon } from '../components/Icons';
import Loader from '../components/Loader';

const LoginPage: React.FC = () => {
  const { signInWithPassword } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState<string>(''); // email or phone
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const isEmail = identifier.includes('@');
    const { error } = await signInWithPassword({
      email: isEmail ? identifier : undefined,
      phone: !isEmail ? identifier : undefined,
      password,
    });
    setLoading(false);
    if (error) {
      setError(error);
      return;
    }
    navigate('/pos');
  };


  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-brand-950 p-4">
      <div className="w-full max-w-sm text-center relative">
        <button onClick={() => navigate(-1)} className="absolute left-0 top-0 p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700" aria-label="Voltar">
          <ChevronLeftIcon className="h-6 w-6" />
        </button>
        <div className="flex items-center justify-center gap-2 mb-4">
            <QRCodeCanvas value="QRSales" size={48} bgColor="transparent" fgColor={document.documentElement.classList.contains('dark') ? '#38bdf8' : '#0284c7'} />
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">
                Vendas
            </h2>
        </div>
        <p className="mt-2 mb-8 text-sm text-gray-600 dark:text-gray-400">
          Acesse sua conta para começar
        </p>

        <form className="space-y-8" onSubmit={handleSubmit}>
          <div className="relative">
            <input
              id="identifier"
              name="identifier"
              type="text"
              autoComplete="email"
              required
              className="peer h-10 w-full border-b-2 border-gray-300 bg-transparent text-gray-900 placeholder-transparent focus:outline-none focus:border-brand-600 dark:bg-transparent dark:border-gray-600 dark:text-white dark:focus:border-brand-400"
              placeholder="Email ou Telefone"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
            />
            <label
              htmlFor="identifier"
              className="absolute left-0 -top-3.5 text-gray-600 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-2 peer-focus:-top-3.5 peer-focus:text-gray-600 peer-focus:text-sm dark:text-gray-400 dark:peer-focus:text-gray-400"
            >
              Email ou Telefone
            </label>
          </div>
          <div className="relative">
             <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="peer h-10 w-full border-b-2 border-gray-300 bg-transparent text-gray-900 placeholder-transparent focus:outline-none focus:border-brand-600 dark:bg-transparent dark:border-gray-600 dark:text-white dark:focus:border-brand-400"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <label
              htmlFor="password"
              className="absolute left-0 -top-3.5 text-gray-600 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-2 peer-focus:-top-3.5 peer-focus:text-gray-600 peer-focus:text-sm dark:text-gray-400 dark:peer-focus:text-gray-400"
            >
              Senha
            </label>
          </div>

          {error && (
            <div className="text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}
          
          <div className="text-sm text-right">
              <Link to="/forgot-password" className="font-medium text-brand-600 hover:text-brand-500 dark:text-brand-400">
                  Esqueceu sua senha?
              </Link>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-brand-600 text-white font-medium rounded-lg shadow-md hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-60"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </div>
        </form>
        {loading && <div className="mt-6 flex justify-center"><Loader /></div>}
        
         <p className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
            Não tem uma conta?{' '}
            <Link to="/register" className="font-medium text-brand-600 hover:text-brand-500 dark:text-brand-400">
                Cadastre-se
            </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;