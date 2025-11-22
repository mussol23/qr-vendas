import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Employee } from '../types';
import { PlusIcon, UsersIcon, MagnifyingGlassIcon, PencilIcon, CheckCircleIcon, XCircleIcon } from '../components/Icons';
import { API_URL } from '../lib/api';

const EmployeeForm: React.FC<{ employee?: Employee; onClose: () => void; onSuccess: () => void }> = ({ employee, onClose, onSuccess }) => {
    const isEditing = !!employee;

    const [fullName, setFullName] = useState(employee?.full_name || '');
    const [email, setEmail] = useState(employee?.email || '');
    const [phone, setPhone] = useState(employee?.phone || '');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<'operator' | 'manager' | 'owner'>(employee?.role || 'operator');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [accessData, setAccessData] = useState<{ email: string; password: string; role: string } | null>(null);

    const generatePassword = () => {
        // Gerar senha aleatória de 8 caracteres
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
        let pwd = '';
        for (let i = 0; i < 8; i++) {
            pwd += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setPassword(pwd);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.access_token) {
                setError('Sessão expirada. Faça login novamente.');
                return;
            }

            const url = isEditing
                ? `${API_URL}/employees/${employee.id}`
                : `${API_URL}/employees/create`;

            const method = isEditing ? 'PATCH' : 'POST';
            const body = isEditing
                ? { full_name: fullName, phone, role }
                : { full_name: fullName, email, phone, password, role };

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erro ao salvar funcionário');
            }

            const data = await response.json();

            if (!isEditing && data.access_data) {
                // Mostrar dados de acesso
                setAccessData(data.access_data);
            } else {
                onSuccess();
                onClose();
            }
        } catch (err: any) {
            setError(err.message || 'Erro ao salvar funcionário');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    const getRoleLabel = (r: string) => {
        const labels = {
            operator: 'Vendedor',
            manager: 'Gerente',
            owner: 'Dono'
        };
        return labels[r as keyof typeof labels] || r;
    };

    // Modal de dados de acesso
    if (accessData) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
                    <h2 className="text-2xl font-bold mb-4 text-green-600 dark:text-green-400">✅ Funcionário Criado!</h2>
                    <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">
                        Envie estes dados de acesso ao funcionário:
                    </p>
                    <div className="space-y-3 bg-gray-50 dark:bg-gray-900 p-4 rounded-lg mb-4">
                        <div>
                            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Email:</label>
                            <div className="flex items-center gap-2">
                                <code className="flex-1 bg-white dark:bg-gray-800 p-2 rounded text-sm">{accessData.email}</code>
                                <button
                                    onClick={() => copyToClipboard(accessData.email)}
                                    className="px-3 py-2 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                                >
                                    Copiar
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Senha:</label>
                            <div className="flex items-center gap-2">
                                <code className="flex-1 bg-white dark:bg-gray-800 p-2 rounded text-sm font-bold">{accessData.password}</code>
                                <button
                                    onClick={() => copyToClipboard(accessData.password)}
                                    className="px-3 py-2 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                                >
                                    Copiar
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Função:</label>
                            <p className="text-sm font-medium">{getRoleLabel(accessData.role)}</p>
                        </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                        <button
                            onClick={() => {
                                copyToClipboard(`Email: ${accessData.email}\nSenha: ${accessData.password}\nFunção: ${getRoleLabel(accessData.role)}`);
                            }}
                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                        >
                            Copiar Tudo
                        </button>
                        <button
                            onClick={() => {
                                setAccessData(null);
                                onSuccess();
                                onClose();
                            }}
                            className="px-4 py-2 bg-brand-600 text-white rounded hover:bg-brand-700"
                        >
                            Fechar
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
                <h2 className="text-2xl font-bold mb-4">{isEditing ? 'Editar Funcionário' : 'Criar Funcionário'}</h2>
                {error && (
                    <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded">
                        {error}
                    </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="text"
                        placeholder="Nome Completo"
                        value={fullName}
                        onChange={e => setFullName(e.target.value)}
                        required
                        className="w-full p-2 border rounded bg-white text-gray-900 dark:text-white dark:bg-gray-700 dark:border-gray-600"
                    />
                    {!isEditing && (
                        <>
                            <input
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                                className="w-full p-2 border rounded bg-white text-gray-900 dark:text-white dark:bg-gray-700 dark:border-gray-600"
                            />
                            <div>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Senha (mín. 6 caracteres)"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        required
                                        minLength={6}
                                        className="flex-1 p-2 border rounded bg-white text-gray-900 dark:text-white dark:bg-gray-700 dark:border-gray-600"
                                    />
                                    <button
                                        type="button"
                                        onClick={generatePassword}
                                        className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                                    >
                                        Gerar
                                    </button>
                                </div>
                                {password && <p className="text-xs text-gray-500 mt-1">Senha: <code className="font-bold">{password}</code></p>}
                            </div>
                        </>
                    )}
                    <input
                        type="tel"
                        placeholder="Telefone (opcional)"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        className="w-full p-2 border rounded bg-white text-gray-900 dark:text-white dark:bg-gray-700 dark:border-gray-600"
                    />
                    <select
                        value={role}
                        onChange={e => setRole(e.target.value as 'operator' | 'manager' | 'owner')}
                        required
                        className="w-full p-2 border rounded bg-white text-gray-900 dark:text-white dark:bg-gray-700 dark:border-gray-600"
                    >
                        <option value="operator">{getRoleLabel('operator')}</option>
                        <option value="manager">{getRoleLabel('manager')}</option>
                        <option value="owner">{getRoleLabel('owner')}</option>
                    </select>
                    <div className="flex justify-end space-x-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-brand-600 text-white rounded disabled:opacity-50"
                        >
                            {loading ? 'Salvando...' : (isEditing ? 'Salvar Alterações' : 'Criar Conta')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const EmployeeCard: React.FC<{ employee: Employee; onEdit: (employee: Employee) => void; onToggleActive: (id: string, active: boolean) => void }> = ({ employee, onEdit, onToggleActive }) => {
    const getRoleBadge = (role: string) => {
        const badges = {
            operator: { label: 'Vendedor', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
            manager: { label: 'Gerente', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
            owner: { label: 'Dono', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
        };
        const badge = badges[role as keyof typeof badges] || badges.operator;
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${badge.color}`}>
                {badge.label}
            </span>
        );
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex flex-col justify-between">
            <div>
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg text-brand-600 dark:text-brand-400 pr-2">{employee.full_name}</h3>
                    <button onClick={() => onEdit(employee)} className="text-gray-400 hover:text-blue-500 p-1 flex-shrink-0">
                        <PencilIcon />
                    </button>
                </div>
                <div className="space-y-1">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                        {employee.email || employee.phone || '-'}
                    </p>
                    <div className="flex items-center gap-2">
                        {getRoleBadge(employee.role)}
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${employee.active
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                            }`}>
                            {employee.active ? 'Ativo' : 'Inativo'}
                        </span>
                    </div>
                </div>
            </div>
            <div className="mt-3 pt-3 border-t dark:border-gray-700">
                <button
                    onClick={() => onToggleActive(employee.id, employee.active)}
                    className={`text-sm font-medium ${employee.active
                        ? 'text-orange-600 hover:text-orange-700 dark:text-orange-400'
                        : 'text-green-600 hover:text-green-700 dark:text-green-400'
                        }`}
                >
                    {employee.active ? 'Desativar' : 'Ativar'}
                </button>
            </div>
        </div>
    );
};

const EmployeesPage: React.FC = () => {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<Employee | undefined>(undefined);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchEmployees = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.access_token) return;

            const response = await fetch(`${API_URL}/employees`, {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setEmployees(data.employees || []);
            }
        } catch (error) {
            console.error('Erro ao buscar funcionários:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployees();
    }, []);

    const handleOpenForm = (employee?: Employee) => {
        setEditingEmployee(employee);
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setEditingEmployee(undefined);
        setIsFormOpen(false);
    };

    const handleToggleActive = async (id: string, currentActive: boolean) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.access_token) return;

            const response = await fetch(`${API_URL}/employees/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ active: !currentActive })
            });

            if (response.ok) {
                fetchEmployees();
            }
        } catch (error) {
            console.error('Erro ao atualizar status:', error);
        }
    };

    const filteredEmployees = useMemo(() => {
        if (!searchTerm) return employees;

        return employees.filter(emp =>
            emp.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.phone?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [employees, searchTerm]);

    const summaryStats = useMemo(() => {
        return {
            total: employees.length,
            active: employees.filter(e => e.active).length,
            inactive: employees.filter(e => !e.active).length
        };
    }, [employees]);

    if (loading) {
        return <div className="p-4">Carregando...</div>;
    }

    return (
        <div className="relative">
            <div className="mb-4 space-y-4">
                <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                    </span>
                    <input
                        type="text"
                        placeholder="Pesquisar por nome, email ou telefone..."
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
                        <CheckCircleIcon className="h-5 w-5 mx-auto text-green-500" />
                        <p className="text-xs sm:text-sm font-semibold mt-1">Ativos</p>
                        <p className="text-sm sm:text-lg font-bold">{summaryStats.active}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-2 sm:p-3 rounded-lg shadow">
                        <XCircleIcon className="h-5 w-5 mx-auto text-gray-500" />
                        <p className="text-xs sm:text-sm font-semibold mt-1">Inativos</p>
                        <p className="text-sm sm:text-lg font-bold">{summaryStats.inactive}</p>
                    </div>
                </div>
            </div>

            {filteredEmployees.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 text-center p-8 bg-white dark:bg-gray-800 rounded-lg">
                    <UsersIcon className="h-12 w-12 text-gray-400" />
                    <p className="mt-2 font-bold">{searchTerm ? 'Nenhum funcionário encontrado' : 'Nenhum funcionário cadastrado.'}</p>
                    <p className="text-sm">{searchTerm ? 'Tente uma busca diferente.' : "Clique no botão '+' para criar seu primeiro funcionário."}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-20">
                    {filteredEmployees.map(employee => (
                        <EmployeeCard
                            key={employee.id}
                            employee={employee}
                            onEdit={handleOpenForm}
                            onToggleActive={handleToggleActive}
                        />
                    ))}
                </div>
            )}

            <div className="fixed bottom-20 right-4 z-20">
                <button
                    onClick={() => handleOpenForm()}
                    className="bg-brand-600 text-white p-4 rounded-full shadow-lg hover:bg-brand-700 transition-transform transform hover:scale-110"
                >
                    <PlusIcon />
                </button>
            </div>

            {isFormOpen && (
                <EmployeeForm
                    employee={editingEmployee}
                    onClose={handleCloseForm}
                    onSuccess={fetchEmployees}
                />
            )}
        </div>
    );
};

export default EmployeesPage;
