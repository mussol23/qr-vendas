import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { useAuth } from '../context/AuthContext';

export default function SuccessPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Proteção: Se usuário estiver autenticado, redirecionar para login
  // (página de sucesso só deve aparecer após logout do registro)
  useEffect(() => {
    if (user) {
      console.log('⚠️ SuccessPage: Usuário autenticado detectado, redirecionando para login...');
      navigate('/login', { replace: true });
    }
  }, [user, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4">
      <div className="max-w-md w-full">
        {/* Success Animation */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full mb-6 animate-bounce">
            <div className="text-6xl">✅</div>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">
            Conta Criada com Sucesso!
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Sua conta foi criada e está pronta para usar
          </p>
        </div>

        {/* Success Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-6">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <QRCodeCanvas 
              value="QRVendas" 
              size={48} 
              bgColor="transparent" 
              fgColor={document.documentElement.classList.contains('dark') ? '#38bdf8' : '#0284c7'} 
            />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              QR Vendas
            </h2>
          </div>

          {/* Info */}
          <div className="mb-8">
            <div className="flex items-start gap-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <span className="text-2xl">🏪</span>
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Status
                </p>
                <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                  Estabelecimento Criado com Sucesso
                </p>
              </div>
            </div>
          </div>

          {/* Próximos Passos */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              📋 Próximos Passos
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-full flex items-center justify-center text-sm font-bold">
                  1
                </span>
                <span className="text-gray-700 dark:text-gray-300">
                  Faça login com suas credenciais
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-full flex items-center justify-center text-sm font-bold">
                  2
                </span>
                <span className="text-gray-700 dark:text-gray-300">
                  Complete os dados da sua loja
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-full flex items-center justify-center text-sm font-bold">
                  3
                </span>
                <span className="text-gray-700 dark:text-gray-300">
                  Comece a cadastrar produtos e fazer vendas
                </span>
              </li>
            </ul>
          </div>

          {/* Button */}
          <button
            onClick={() => navigate('/login')}
            className="w-full py-4 px-6 bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 text-white rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-3"
          >
            <span>🔐</span>
            <span>Ir para Login</span>
            <span>→</span>
          </button>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Bem-vindo ao QR Vendas! 🎉
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
            Sistema de Gestão Comercial
          </p>
        </div>
      </div>
    </div>
  );
}

