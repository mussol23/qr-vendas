
import React from 'react';
import { Link } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';

const ForgotPasswordPage: React.FC = () => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Se um e-mail correspondente for encontrado, um link de recuperação será enviado.');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
              <QRCodeCanvas value="QRSales" size={48} bgColor="transparent" fgColor={document.documentElement.classList.contains('dark') ? '#38bdf8' : '#0284c7'} />
              <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">
                  Vendas
              </h2>
          </div>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Recupere o acesso à sua conta
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">Email</label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-brand-500 focus:border-brand-500 focus:z-10 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                placeholder="Digite seu email"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500"
            >
              Enviar Link de Recuperação
            </button>
          </div>
        </form>
         <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
            Lembrou da senha?{' '}
            <Link to="/login" className="font-medium text-brand-600 hover:text-brand-500 dark:text-brand-400">
                Voltar ao Login
            </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
