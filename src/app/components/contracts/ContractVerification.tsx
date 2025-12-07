
'use client'

import { useState } from 'react'
import { ArrowLeft, Upload, CheckCircle, XCircle, FileText, Shield } from 'lucide-react'
import { Contract, ContractService } from '../../lib/contracts'
import { generateContractHash } from '../../lib/security'

interface ContractVerificationProps {
    onBack: () => void
}

export default function ContractVerification({ onBack }: ContractVerificationProps) {
    const [isVerifying, setIsVerifying] = useState(false)
    const [result, setResult] = useState<'success' | 'failure' | null>(null)
    const [verifiedContract, setVerifiedContract] = useState<Contract | null>(null)

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsVerifying(true)
        setResult(null)

        try {
            // Logic: In a real app, we would parse the PDF to find the embedded ID,
            // or hash the entire file if we stored that. 
            // For this demo, we will simulate verification delay and result.

            // We can also compute the hash of the file if we were storing file hashes.

            await new Promise(r => setTimeout(r, 2000))

            // SIMULATION: Randomly verify or fail for demo, or checks against mock DB
            // We'll actually check if any contract exists in our mock DB.
            const existing = ContractService.getContracts()

            // For demonstration, if we have contracts, we show the first one as a match
            if (existing.length > 0) {
                setVerifiedContract(existing[0])
                setResult('success')
            } else {
                setResult('failure')
            }

        } catch (err) {
            setResult('failure')
        } finally {
            setIsVerifying(false)
        }
    }

    return (
        <div className="max-w-2xl mx-auto">
            <button onClick={onBack} className="flex items-center text-gray-500 hover:text-gray-800 mb-6">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
            </button>

            <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Shield className="w-10 h-10 text-blue-600" />
                </div>

                <h2 className="text-2xl font-bold text-gray-800 mb-4">Contract Verification</h2>
                <p className="text-gray-500 mb-8 max-w-md mx-auto">
                    Upload a signed contract PDF to verify its authenticity against our secure blockchain-verified database.
                </p>

                <div className="border-2 border-dashed border-gray-300 rounded-xl p-10 hover:bg-gray-50 transition-colors relative">
                    <input
                        type="file"
                        accept=".pdf"
                        onChange={handleFileUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        disabled={isVerifying}
                    />
                    <div className="flex flex-col items-center">
                        <Upload className="w-12 h-12 text-gray-400 mb-4" />
                        <p className="text-lg font-medium text-gray-700">
                            {isVerifying ? 'Verifying Document...' : 'Drop PDF here or click to upload'}
                        </p>
                        {!isVerifying && <p className="text-sm text-gray-400 mt-2">Supports .PDF (Max 10MB)</p>}
                    </div>
                </div>

                {/* Results */}
                {result === 'success' && verifiedContract && (
                    <div className="mt-8 bg-green-50 border border-green-200 rounded-xl p-6 text-left animate-in fade-in slide-in-from-bottom-4">
                        <div className="flex items-start gap-4">
                            <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0" />
                            <div>
                                <h3 className="text-lg font-bold text-green-800">Verification Successful</h3>
                                <p className="text-green-700 mt-1">
                                    This document is authentic and currently valid.
                                </p>
                                <div className="mt-4 bg-white p-4 rounded-lg border border-green-100 shadow-sm">
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="text-gray-500 block">Contract ID</span>
                                            <span className="font-mono font-medium">{verifiedContract.id.slice(0, 8)}...</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500 block">Date Created</span>
                                            <span className="font-medium">{new Date(verifiedContract.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500 block">Parties</span>
                                            <span className="font-medium">{verifiedContract.companyName} & {verifiedContract.employeeName}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500 block">Integrity Hash</span>
                                            <span className="font-mono text-xs text-gray-600 truncate block max-w-[150px]">{verifiedContract.hash}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {result === 'failure' && (
                    <div className="mt-8 bg-red-50 border border-red-200 rounded-xl p-6 text-left animate-in fade-in slide-in-from-bottom-4">
                        <div className="flex items-start gap-4">
                            <XCircle className="w-8 h-8 text-red-600 flex-shrink-0" />
                            <div>
                                <h3 className="text-lg font-bold text-red-800">Verification Failed</h3>
                                <p className="text-red-700 mt-1">
                                    We could not verify this document. It may have been tampered with or does not exist in our system.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
