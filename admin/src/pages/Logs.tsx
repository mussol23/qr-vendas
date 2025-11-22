export default function Logs() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          📝 Logs do Sistema
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Auditoria e logs de atividades
        </p>
      </div>

      <div className="card">
        <p className="text-gray-600 dark:text-gray-400">
          Sistema de logs em construção. Em breve você poderá:
        </p>
        <ul className="mt-4 space-y-2 text-gray-700 dark:text-gray-300">
          <li>✅ Ver logs de todas as ações</li>
          <li>✅ Filtrar por usuário, data, tipo</li>
          <li>✅ Exportar logs</li>
          <li>✅ Níveis: INFO, WARN, ERROR, CRITICAL</li>
        </ul>
      </div>
    </div>
  );
}

