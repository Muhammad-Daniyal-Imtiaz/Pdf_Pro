
'use client'

import { useState, useEffect } from 'react'
import { Plus, Upload, FileText, CheckCircle, Clock, ShieldCheck, Search } from 'lucide-react'
import { Contract, ContractService } from '../../lib/contracts'
import ContractGenerator from './ContractGenerator'
import ContractVerification from './ContractVerification'

export default function ContractDashboard() {
    const [view, setView] = useState<'list' | 'create' | 'verify'>('list')
    const [contracts, setContracts] = useState<Contract[]>([])

    useEffect(() => {
        // Load contracts from local storage
        setContracts(ContractService.getContracts())
    }, [view]) // Refresh when view changes (e.g. after creation)

    const handleCreateComplete = () => {
        setView('list')
    }

    if (view === 'create') {
        return <ContractGenerator onBack={() => setView('list')} onComplete={handleCreateComplete} />
    }

    if (view === 'verify') {
        return <ContractVerification onBack={() => setView('list')} />
    }

    return (
        <div className="space-y-8">
            {/* Header Actions */}
            <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                            <ShieldCheck className="w-8 h-8 text-blue-600" />
                            Contract Management
                        </h2>
                        <p className="text-gray-500 mt-2">
                            Create, manage, and verify secure employment contracts utilizing AI and blockchain-grade hashing.
                        </p>
                    </div>
                    <div className="flex gap-4 w-full md:w-auto">
                        <button
                            onClick={() => setView('verify')}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-green-500 text-green-600 rounded-xl font-semibold hover:bg-green-50 transition-all"
                        >
                            <Upload className="w-4 h-4" />
                            Verify PDF
                        </button>
                        <button
                            onClick={() => setView('create')}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
                        >
                            <Plus className="w-4 h-4" />
                            New Contract
                        </button>
                    </div>
                </div>
            </div>

            {/* Contracts List */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-bold text-gray-800 text-lg">Recent Contracts</h3>
                    <div className="relative">
                        {/* Placeholder for search if needed */}
                    </div>
                </div>

                {contracts.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FileText className="w-8 h-8 text-gray-400" />
                        </div>
                        <h4 className="text-lg font-medium text-gray-800 mb-2">No Contracts Yet</h4>
                        <p className="mb-6">Create your first professional contract using our AI or manual tools.</p>
                        <button
                            onClick={() => setView('create')}
                            className="text-blue-600 font-semibold hover:text-blue-700 hover:underline"
                        >
                            Create Contract Now &rarr;
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                                <tr>
                                    <th className="p-4 font-semibold">Contract ID / Name</th>
                                    <th className="p-4 font-semibold">Type</th>
                                    <th className="p-4 font-semibold">Employee</th>
                                    <th className="p-4 font-semibold">Status</th>
                                    <th className="p-4 font-semibold">Date</th>
                                    <th className="p-4 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {contracts.map((contract) => (
                                    <tr key={contract.id} className="hover:bg-blue-50/30 transition-colors group">
                                        <td className="p-4">
                                            <div className="font-medium text-gray-800 group-hover:text-blue-600">
                                                {contract.companyName}
                                            </div>
                                            <div className="text-xs text-gray-400 font-mono mt-1">
                                                #{contract.id.slice(0, 8)}...
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                                                {contract.type.replace('-', ' ')}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-gray-800 font-medium">{contract.employeeName}</div>
                                            <div className="text-xs text-gray-500">{contract.employeePosition}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-1.5">
                                                {contract.status === 'verified' && <CheckCircle className="w-4 h-4 text-green-500" />}
                                                {contract.status === 'generated' && <CheckCircle className="w-4 h-4 text-green-500" />}
                                                {contract.status === 'draft' && <Clock className="w-4 h-4 text-yellow-500" />}
                                                <span className="capitalize text-sm text-gray-600">{contract.status}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm text-gray-500">
                                            {new Date(contract.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="p-4 text-right">
                                            <button className="text-gray-400 hover:text-blue-600 font-medium text-sm">
                                                View Details
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}
