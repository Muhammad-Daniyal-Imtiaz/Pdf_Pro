
'use client'

import { useState } from 'react'
import { ArrowLeft, User, Building, Calendar, DollarSign, FileText, Sparkles, Download, Check, Briefcase, Shield, PenTool, LayoutTemplate } from 'lucide-react'
import { jsPDF } from 'jspdf'
import { Contract, ContractService, CONTRACT_TEMPLATES, ContractTemplate, ContractClause } from '../../lib/contracts'
import { generateContractHash } from '../../lib/security'

interface ContractGeneratorProps {
    onBack: () => void
    onComplete: () => void
}

export default function ContractGenerator({ onBack, onComplete }: ContractGeneratorProps) {
    const [mode, setMode] = useState<'manual' | 'ai'>('manual')
    const [step, setStep] = useState(1) // 1: Mode/Template, 2: Details/Prompt, 3: Preview
    const [isGenerating, setIsGenerating] = useState(false)
    const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null)

    // Form State
    const [formData, setFormData] = useState<Partial<Contract>>({
        companyName: '',
        companyAddress: '',
        companyContact: '',
        employeeName: '',
        employeeEmail: '',
        employeePosition: '',
        salary: '',
        currency: 'USD',
        startDate: '',
        clauses: []
    })

    const [aiPrompt, setAiPrompt] = useState('')

    // Variable Substitution Logic
    const getSubstitutedContent = (content: string) => {
        return content
            .replace(/{{companyName}}/g, formData.companyName || '[Company Name]')
            .replace(/{{employeeName}}/g, formData.employeeName || '[Employee Name]')
            .replace(/{{employeePosition}}/g, formData.employeePosition || '[Position]')
            .replace(/{{salary}}/g, formData.salary || '[Salary]')
            .replace(/{{currency}}/g, formData.currency || '$')
            .replace(/{{startDate}}/g, formData.startDate || '[Date]')
    }

    const handleTemplateSelect = (template: ContractTemplate) => {
        setSelectedTemplate(template)
        setFormData(prev => ({
            ...prev,
            type: template.type,
            // Load default clauses from template
            clauses: template.defaultClauses.map(c => ({ ...c }))
        }))
        setStep(2)
    }

    const handleManualSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setStep(3) // Preview
    }

    const handleAIGenerate = async () => {
        setIsGenerating(true)
        try {
            const response = await fetch('/api/generate-ai-content', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'contract',
                    prompt: aiPrompt
                })
            })

            const data = await response.json()

            if (data.error) {
                throw new Error(data.error)
            }

            // The AI returns a JSON string or text. We need to handle it.
            // Since our prompt asks for JSON, let's try to parse it. 
            // If it's pure text, we might need a fallback.
            let generated: any = {}
            try {
                // Attempt to find JSON block if wrapped in markdown
                const jsonMatch = data.content.match(/\{[\s\S]*\}/)
                const jsonStr = jsonMatch ? jsonMatch[0] : data.content
                generated = JSON.parse(jsonStr)
            } catch (e) {
                // Fallback: If parse fails, treat whole text as one big clause or error
                console.warn("Could not parse AI JSON, using fallback")
                generated = {
                    clauses: [{ id: 'ai-gen', title: 'Contract Terms', content: data.content, type: 'custom' }]
                }
            }

            // Update Form Data with AI results
            setFormData(prev => ({
                ...prev,
                companyName: generated.companyName || prev.companyName,
                employeeName: generated.employeeName || prev.employeeName,
                employeePosition: generated.position || prev.employeePosition, // mapped from AI 'position'
                salary: generated.salary || prev.salary,
                startDate: generated.startDate || prev.startDate,
                clauses: generated.clauses || []
            }))

            setStep(3)
        } catch (err) {
            alert("Failed to generate contract: " + err)
        } finally {
            setIsGenerating(false)
        }
    }

    const generatePDF = (): Blob => {
        const doc = new jsPDF()
        const lineHeight = 7
        let y = 20

        // Title
        doc.setFontSize(22)
        doc.setFont('helvetica', 'bold')
        doc.text(selectedTemplate?.name || 'CONTRACT AGREEMENT', 105, y, { align: 'center' })
        y += 15

        // Meta
        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(100)
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 105, y, { align: 'center' })
        y += 20
        doc.setTextColor(0)

        // Parties
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.text('BETWEEN:', 20, y)
        y += 7
        doc.setFont('helvetica', 'normal')
        doc.text(`${formData.companyName}`, 20, y)
        y += 10

        doc.setFont('helvetica', 'bold')
        doc.text('AND:', 20, y)
        y += 7
        doc.setFont('helvetica', 'normal')
        doc.text(`${formData.employeeName}`, 20, y)
        y += 20

        // Offer Details Table-ish
        doc.setFillColor(245, 247, 250)
        doc.rect(20, y, 170, 35, 'F')
        y += 10
        doc.setFontSize(11)

        doc.setFont('helvetica', 'bold')
        doc.text('Position:', 25, y)
        doc.setFont('helvetica', 'normal')
        doc.text(formData.employeePosition || '', 60, y)
        y += 10

        doc.setFont('helvetica', 'bold')
        doc.text('Start Date:', 25, y)
        doc.setFont('helvetica', 'normal')
        doc.text(formData.startDate || '', 60, y)
        y += 10

        doc.setFont('helvetica', 'bold')
        doc.text('Compensation:', 25, y)
        doc.setFont('helvetica', 'normal')
        doc.text(`${formData.currency} ${formData.salary}`, 60, y)
        y += 20

        // Clauses
        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.text('TERMS AND CONDITIONS', 20, y)
        y += 10

        doc.setFontSize(11)
        doc.setFont('helvetica', 'normal')

        formData.clauses?.forEach((clause) => {
            // Check for page break
            if (y > 270) {
                doc.addPage()
                y = 20
            }

            doc.setFont('helvetica', 'bold')
            doc.text(clause.title, 20, y)
            y += 7

            doc.setFont('helvetica', 'normal')
            const substitutedContent = getSubstitutedContent(clause.content)
            const splitText = doc.splitTextToSize(substitutedContent, 170)
            doc.text(splitText, 20, y)
            y += (splitText.length * lineHeight) + 5
        })

        // Signatures
        if (y > 230) {
            doc.addPage()
            y = 40
        } else {
            y += 30
        }

        doc.line(20, y, 90, y)
        doc.line(110, y, 180, y)
        y += 5
        doc.setFontSize(10)
        doc.text('Signed by Company', 20, y)
        doc.text('Signed by Employee', 110, y)

        // Output
        return doc.output('blob')
    }

    const handleSaveAndSign = async () => {
        // 1. Generate full content string for hashing (clauses + data)
        const fullContent = JSON.stringify({
            ...formData,
            clauses: formData.clauses?.map(c => ({ ...c, content: getSubstitutedContent(c.content) }))
        })

        // 2. Generate Hash
        const hash = await generateContractHash(fullContent)

        // 3. Create Contract Object
        const newContract: Contract = {
            id: crypto.randomUUID(),
            type: formData.type as any || 'contract',
            status: 'generated',
            createdAt: new Date().toISOString(),
            hash: hash,
            companyName: formData.companyName || 'Unknown',
            companyAddress: formData.companyAddress || '',
            companyContact: formData.companyContact || '',
            employeeName: formData.employeeName || 'Unknown',
            employeeEmail: formData.employeeEmail || '',
            employeePosition: formData.employeePosition || '',
            salary: formData.salary || '',
            currency: formData.currency || 'USD',
            startDate: formData.startDate || '',
            clauses: formData.clauses || []
        }

        // 4. Save to DB
        ContractService.saveContract(newContract)

        // 5. Download PDF
        const blob = generatePDF()

        // Need to add hash to the PDF? The generatePDF function above doesn't add the hash.
        // Let's create a downloader from the blob.
        // Actually, to add the hash, we need to modify the PDF generation OR rely on the fact that the HASH is of the content.
        // In the previous code, I was saving the PDF directly.

        // Let's use file-saver logic or just anchor tag
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `contract-${newContract.employeeName.replace(/\s+/g, '-').toLowerCase()}.pdf`
        a.click()

        onComplete()
    }

    // --- RENDER HELPERS ---

    const renderModeSelection = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <button
                onClick={() => { setMode('manual'); setSelectedTemplate(null); }}
                className={`p-6 rounded-xl border-2 text-left transition-all ${mode === 'manual' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-200'
                    }`}
            >
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-800">Use a Template</h3>
                <p className="text-gray-500 text-sm mt-2">
                    Select from our library of verified legal templates (Employment, Freelance, NDA).
                </p>
            </button>

            <button
                onClick={() => { setMode('ai'); setStep(2); }}
                className={`p-6 rounded-xl border-2 text-left transition-all ${mode === 'ai' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-200'
                    }`}
            >
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                    <Sparkles className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-800">Generate with AI</h3>
                <p className="text-gray-500 text-sm mt-2">
                    Describe what you need, and our AI will draft a custom contract in seconds.
                </p>
            </button>
        </div>
    )

    const renderTemplateSelection = () => {
        // Group templates by category
        const categories = Array.from(new Set(CONTRACT_TEMPLATES.map(t => t.category)))

        return (
            <div className="mt-8 space-y-8">
                {categories.map(category => (
                    <div key={category}>
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">{category} Contracts</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {CONTRACT_TEMPLATES.filter(t => t.category === category).map(template => (
                                <button
                                    key={template.id}
                                    onClick={() => handleTemplateSelect(template)}
                                    className="flex items-start gap-4 p-4 border border-gray-200 rounded-xl hover:border-blue-400 hover:shadow-md transition-all text-left group bg-white"
                                >
                                    <div className="p-3 bg-gray-50 rounded-lg group-hover:bg-blue-50 transition-colors">
                                        {template.category === 'Employment' && <Briefcase className="w-5 h-5 text-gray-600 group-hover:text-blue-600" />}
                                        {template.category === 'Freelance' && <PenTool className="w-5 h-5 text-gray-600 group-hover:text-blue-600" />}
                                        {template.category === 'Legal' && <Shield className="w-5 h-5 text-gray-600 group-hover:text-blue-600" />}
                                        {template.category === 'Service' && <LayoutTemplate className="w-5 h-5 text-gray-600 group-hover:text-blue-600" />}
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-800 group-hover:text-blue-600">{template.name}</h4>
                                        <p className="text-sm text-gray-500 mt-1">{template.description}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    const renderManualForm = () => (
        <form onSubmit={handleManualSubmit} className="space-y-6 mt-8">
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg flex items-center gap-3">
                <div className="p-2 bg-white rounded-md shadow-sm">
                    <LayoutTemplate className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                    <h3 className="font-semibold text-blue-900">Selected: {selectedTemplate?.name}</h3>
                    <p className="text-xs text-blue-700">Please fill in the details below to complete your contract.</p>
                </div>
                <button type="button" onClick={() => setStep(1)} className="ml-auto text-sm text-blue-600 hover:underline">Change</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                    <div className="relative">
                        <Building className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                        <input
                            required
                            className="w-full pl-10 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Acme Inc."
                            value={formData.companyName}
                            onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Employee / Contractor Name</label>
                    <div className="relative">
                        <User className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                        <input
                            required
                            className="w-full pl-10 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="John Doe"
                            value={formData.employeeName}
                            onChange={e => setFormData({ ...formData, employeeName: e.target.value })}
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                    <div className="relative">
                        <Calendar className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                        <input
                            type="date"
                            required
                            className="w-full pl-10 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            value={formData.startDate}
                            onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Annual Salary / Rate</label>
                    <div className="relative">
                        <DollarSign className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                        <input
                            type="text"
                            required
                            className="w-full pl-10 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="95,000"
                            value={formData.salary}
                            onChange={e => setFormData({ ...formData, salary: e.target.value })}
                        />
                    </div>
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Position Title</label>
                    <input
                        required
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Senior Software Engineer"
                        value={formData.employeePosition}
                        onChange={e => setFormData({ ...formData, employeePosition: e.target.value })}
                    />
                </div>
            </div>

            <div className="border-t pt-6">
                <h4 className="font-medium text-gray-800 mb-4">Clauses Preview</h4>
                <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                    {formData.clauses?.map((clause, idx) => (
                        <div key={idx} className="p-4 bg-gray-50 rounded-lg border border-gray-100 text-sm">
                            <strong className="block text-gray-700 mb-1">{clause.title}</strong>
                            <p className="text-gray-600">{getSubstitutedContent(clause.content)}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <button type="submit" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                    Generate Final Contract &rarr;
                </button>
            </div>
        </form>
    )

    const renderAIForm = () => (
        <div className="space-y-6 mt-8">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Describe the Contract</label>
                <p className="text-xs text-gray-500 mb-2">Be specific about the role, salary, date, and any special terms.</p>
                <textarea
                    className="w-full p-4 border rounded-xl h-40 focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g. Create a 1-year remote developer contract for John Smith with $95k salary, 20 days PTO, and standard IP rights clause..."
                    value={aiPrompt}
                    onChange={e => setAiPrompt(e.target.value)}
                />
            </div>
            <button
                onClick={handleAIGenerate}
                disabled={!aiPrompt || isGenerating}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:shadow-lg disabled:opacity-50 transition-all flex justify-center items-center gap-2"
            >
                {isGenerating ? <div className="animate-spin w-5 h-5 border-2 border-white rounded-full border-t-transparent" /> : <Sparkles className="w-5 h-5" />}
                Generate Contract with AI
            </button>
        </div>
    )

    const renderFinalPreview = () => (
        <div className="mt-8">
            <div className="bg-white border-2 border-gray-200 rounded-xl p-8 mb-6 shadow-xl max-h-[600px] overflow-y-auto">
                {/* Document View Logic for Preview */}
                <div className="text-center mb-8 border-b pb-8">
                    <h2 className="font-bold text-2xl uppercase tracking-wide mb-2">{selectedTemplate?.name || 'EMPLOYMENT CONTRACT'}</h2>
                    <p className="text-gray-400 text-sm">Draft ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
                </div>

                <div className="space-y-6 font-serif text-gray-800 leading-relaxed">
                    <div className="flex justify-between items-start bg-gray-50 p-6 rounded-lg mb-8">
                        <div>
                            <h4 className="text-xs font-bold text-gray-400 uppercase">Between</h4>
                            <p className="font-bold text-lg">{formData.companyName}</p>
                            <p className="text-sm text-gray-600">{formData.companyAddress}</p>
                        </div>
                        <div className="text-right">
                            <h4 className="text-xs font-bold text-gray-400 uppercase">And</h4>
                            <p className="font-bold text-lg">{formData.employeeName}</p>
                            <p className="text-sm text-gray-600">{formData.employeeEmail}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-8 text-sm">
                        <div className="p-3 border rounded">
                            <span className="block text-gray-400 text-xs uppercase">Position</span>
                            <span className="font-bold">{formData.employeePosition}</span>
                        </div>
                        <div className="p-3 border rounded">
                            <span className="block text-gray-400 text-xs uppercase">Start Date</span>
                            <span className="font-bold">{formData.startDate}</span>
                        </div>
                        <div className="p-3 border rounded">
                            <span className="block text-gray-400 text-xs uppercase">Compensation</span>
                            <span className="font-bold">{formData.currency} {formData.salary}</span>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {formData.clauses?.map((clause, i) => (
                            <div key={i}>
                                <h4 className="font-bold mb-2 uppercase text-sm tracking-wide">{clause.title}</h4>
                                <p className="text-justify text-sm">{getSubstitutedContent(clause.content)}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-4">
                <button
                    onClick={() => setStep(mode === 'manual' ? 2 : 1)}
                    className="px-6 py-3 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                >
                    Back to Edit
                </button>
                <button
                    onClick={handleSaveAndSign}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center gap-2 shadow-lg hover:shadow-green-200 transition-all"
                >
                    <Download className="w-4 h-4" />
                    Sign & Download PDF
                </button>
            </div>
        </div>
    )

    return (
        <div className="max-w-4xl mx-auto">
            <button onClick={onBack} className="flex items-center text-gray-500 hover:text-gray-800 mb-6">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
            </button>

            <div className="rounded-2xl p-2">
                {step !== 3 && (
                    <h2 className="text-3xl font-bold text-gray-800 mb-2">
                        {step === 1 ? 'Start New Contract' : 'Contract Details'}
                    </h2>
                )}

                {step === 1 && (
                    <>
                        {renderModeSelection()}
                        {mode === 'manual' && renderTemplateSelection()}
                    </>
                )}

                {step === 2 && (
                    <div className="bg-white rounded-xl shadow-xl p-8 mt-4 animate-in fade-in slide-in-from-bottom-4">
                        {mode === 'manual' ? renderManualForm() : renderAIForm()}
                    </div>
                )}

                {step === 3 && renderFinalPreview()}
            </div>
        </div>
    )
}
