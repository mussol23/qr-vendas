import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Client } from '../types';
import { PlusIcon, UsersIcon, MagnifyingGlassIcon, PlusCircleIcon, BanknotesIcon, PencilIcon } from '../components/Icons';

const ClientForm: React.FC<{ client?: Client; onClose: () => void }> = ({ client, onClose }) => {
    const { addClient, updateClient } = useData();
    const isEditing = !!client;

    const [name, setName] = useState(client?.name || '');
    const [phone, setPhone] = useState(client?.phone || '');
    const [address, setAddress] = useState(client?.address || '');
    const [nif, setNif] = useState(client?.nif || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isEditing) {
            updateClient({ ...client, name, phone, address, nif });
        } else {
            addClient({ name, phone, address, nif });
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
                <h2 className="text-2xl font-bold mb-4">{isEditing ? 'Editar Cliente' : 'Adicionar Novo Cliente'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="text" placeholder="Nome do Cliente" value={name} onChange={e => setName(e.target.value)} required className="w-full p-2 border rounded bg-white text-gray-900 dark:text-white dark:bg-gray-700 dark:border-gray-600"/>
                    <input type="tel" placeholder="Número de Telefone" value={phone} onChange={e => setPhone(e.target.value)} required className="w-full p-2 border rounded bg-white text-gray-900 dark:text-white dark:bg-gray-700 dark:border-gray-600"/>
                    <input type="text" placeholder="Endereço" value={address} onChange={e => setAddress(e.target.value)} required className="w-full p-2 border rounded bg-white text-gray-900 dark:text-white dark:bg-gray-700 dark:border-gray-600"/>
                    <input type="text" placeholder="NIF" value={nif} onChange={e => setNif(e.target.value)} required className="w-full p-2 border rounded bg-white text-gray-900 dark:text-white dark:bg-gray-700 dark:border-gray-600"/>
                    <div className="flex justify-end space-x-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-brand-600 text-white rounded">{isEditing ? 'Salvar Alterações' : 'Salvar'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const ClientCard: React.FC<{ client: Client; onEdit: (client: Client) => void }> = ({ client, onEdit }) => {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start">
                  <h3 className="font-bold text-lg text-brand-600 dark:text-brand-400 pr-2">{client.name}</h3>
                  <button onClick={() => onEdit(client)} className="text-gray-400 hover:text-blue-500 p-1 flex-shrink-0">
                      <PencilIcon />
                  </button>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Telefone: {client.phone}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">NIF: {client.nif}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{client.address}</p>
            </div>
        </div>
    );
};

const ClientsPage: React.FC = () => {
    const { clients, sales } = useData();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | undefined>(undefined);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterByDebt, setFilterByDebt] = useState(false);

    const handleOpenForm = (client?: Client) => {
        setEditingClient(client);
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setEditingClient(undefined);
        setIsFormOpen(false);
    };

    const clientsWithDebt = useMemo(() => {
        return new Set(
            sales.filter(s => s.status === 'pending' && s.clientId).map(s => s.clientId)
        );
    }, [sales]);

    const filteredClients = useMemo(() => {
        let clientsToFilter = clients;

        if (filterByDebt) {
            clientsToFilter = clientsToFilter.filter(client => clientsWithDebt.has(client.id));
        }

        if (searchTerm) {
            return clientsToFilter.filter(client => 
                client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                client.nif.toLowerCase().includes(searchTerm.toLowerCase()) ||
                client.phone.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        
        return clientsToFilter;
    }, [clients, searchTerm, filterByDebt, clientsWithDebt]);
    
    const summaryStats = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        const addedToday = clients.filter(c => c.createdAt.split('T')[0] === today).length;
        
        return {
            total: clients.length,
            addedToday,
            withDebt: clientsWithDebt.size
        }
    }, [clients, clientsWithDebt]);

    return (
        <div className="relative">
            <div className="mb-4 space-y-4">
                <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                    </span>
                    <input
                        type="text"
                        placeholder="Pesquisar por nome, NIF ou telefone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full p-2 pl-10 border rounded-lg bg-white text-gray-900 dark:text-white dark:bg-gray-800 dark:border-gray-600 focus:ring-brand-500 focus:border-brand-500"
                    />
                </div>
                <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
                    <div className="bg-white dark:bg-gray-800 p-2 sm:p-3 rounded-lg shadow">
                        <UsersIcon className="h-5 w-5 mx-auto text-blue-500" />
                        <p className="text-xs sm:text-sm font-semibold mt-1">Total</p>
                        <p className="text-sm sm:text-lg font-bold">{summaryStats.total}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-2 sm:p-3 rounded-lg shadow">
                        <PlusCircleIcon className="h-5 w-5 mx-auto text-green-500" />
                        <p className="text-xs sm:text-sm font-semibold mt-1">Adicionados Hoje</p>
                        <p className="text-sm sm:text-lg font-bold">{summaryStats.addedToday}</p>
                    </div>
                    <button 
                        onClick={() => setFilterByDebt(prev => !prev)}
                        className={`bg-white dark:bg-gray-800 p-2 sm:p-3 rounded-lg shadow w-full text-center transition-all ${filterByDebt ? 'ring-2 ring-orange-500' : ''}`}
                    >
                        <BanknotesIcon className="h-5 w-5 mx-auto text-orange-500" />
                        <p className="text-xs sm:text-sm font-semibold mt-1">Com Dívidas</p>
                        <p className="text-sm sm:text-lg font-bold">{summaryStats.withDebt}</p>
                    </button>
                </div>
            </div>

            {filteredClients.length === 0 ? (
                 <div className="flex flex-col items-center justify-center h-full text-gray-500 text-center p-8 bg-white dark:bg-gray-800 rounded-lg">
                    <UsersIcon className="h-12 w-12 text-gray-400" />
                    <p className="mt-2 font-bold">{searchTerm || filterByDebt ? `Nenhum cliente encontrado` : 'Nenhum cliente cadastrado.'}</p>
                    <p className="text-sm">{searchTerm || filterByDebt ? 'Tente uma busca ou filtro diferente.' : "Clique no botão '+' para adicionar seu primeiro cliente."}</p>
                 </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-20">
                    {filteredClients.map(client => <ClientCard key={client.id} client={client} onEdit={handleOpenForm} />)}
                </div>
            )}

            <div className="fixed bottom-20 right-4 z-20">
                <button onClick={() => handleOpenForm()} className="bg-brand-600 text-white p-4 rounded-full shadow-lg hover:bg-brand-700 transition-transform transform hover:scale-110">
                    <PlusIcon />
                </button>
            </div>
            
            {isFormOpen && <ClientForm client={editingClient} onClose={handleCloseForm} />}
        </div>
    );
};

export default ClientsPage;