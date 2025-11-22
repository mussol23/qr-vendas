export default function Analytics() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          📉 Analytics
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Análises avançadas e KPIs
        </p>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          🎯 KPIs Principais
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">GMV (Gross Merchandise Value)</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">€0</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">AOV (Average Order Value)</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">€0</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Customer Lifetime Value</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">€0</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Taxa de Retenção</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">0%</p>
          </div>
        </div>
      </div>
    </div>
  );
}

