
export interface Contract {
    id: string
    type: 'full-time' | 'contract' | 'internship' | 'consulting' | 'nda'
    status: 'draft' | 'generated' | 'verified'
    createdAt: string
    hash?: string

    // Parties
    companyName: string
    companyAddress: string
    companyContact: string

    employeeName: string
    employeeEmail: string
    employeePosition: string

    // Terms
    salary: string
    currency: string
    startDate: string
    endDate?: string

    // Content
    clauses: ContractClause[]
    fullText?: string
}

export interface ContractClause {
    id: string
    title: string
    content: string
    type: 'standard' | 'custom' | 'special'
}

export interface ContractTemplate {
    id: string
    name: string
    category: 'Employment' | 'Freelance' | 'Legal' | 'Service'
    type: Contract['type']
    description: string
    image?: string // For thumbnail
    defaultClauses: ContractClause[]
}

// Mock Database Service using LocalStorage
const STORAGE_KEY = 'pdf-saas-contracts'

export class ContractService {
    static getContracts(): Contract[] {
        if (typeof window === 'undefined') return []
        const stored = localStorage.getItem(STORAGE_KEY)
        return stored ? JSON.parse(stored) : []
    }

    static getContract(id: string): Contract | null {
        const contracts = this.getContracts()
        return contracts.find(c => c.id === id) || null
    }

    static saveContract(contract: Contract): void {
        const contracts = this.getContracts()
        const index = contracts.findIndex(c => c.id === contract.id)

        if (index >= 0) {
            contracts[index] = contract
        } else {
            contracts.push(contract)
        }

        if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(contracts))
        }
    }

    static verifyContract(hash: string): Contract | null {
        const contracts = this.getContracts()
        return contracts.find(c => c.hash === hash) || null
    }
}

export const CONTRACT_TEMPLATES: ContractTemplate[] = [
    {
        id: 'tpl-full-time-std',
        name: 'Standard Full-Time Agreement',
        category: 'Employment',
        type: 'full-time',
        description: 'Comprehensive employment contract for permanent staff.',
        defaultClauses: [
            {
                id: 'c1',
                title: '1. Position and Duties',
                content: 'The Company agrees to employ the Employee as {{employeePosition}}. The Employee agrees to perform the duties of this position faithfully and to the best of their ability.',
                type: 'standard'
            },
            {
                id: 'c2',
                title: '2. Compensation',
                content: 'As compensation for services, the Company shall pay the Employee an annual salary of {{currency}} {{salary}}, payable in accordance with the Company\'s standard payroll schedule.',
                type: 'standard'
            },
            {
                id: 'c3',
                title: '3. Employment Period',
                content: 'Employment shall commence on {{startDate}} and shall continue until terminated by either party in accordance with the terms of this Agreement.',
                type: 'standard'
            },
            {
                id: 'c4',
                title: '4. Confidentiality',
                content: 'The Employee acknowledges that they may have access to confidential information regarding the Company. The Employee agrees not to disclose such information to any third party.',
                type: 'standard'
            }
        ]
    },
    {
        id: 'tpl-contractor-fix',
        name: 'Freelance / Contractor Agreement',
        category: 'Freelance',
        type: 'contract',
        description: 'Agreement for independent contractors or freelancers.',
        defaultClauses: [
            {
                id: 'c1',
                title: '1. Engagement',
                content: 'The Company hereby engages the Contractor to provide services as {{employeePosition}}.',
                type: 'standard'
            },
            {
                id: 'c2',
                title: '2. Independent Contractor Status',
                content: 'The Contractor is an independent contractor, not an employee. The Contractor is responsible for all taxes and insurance.',
                type: 'standard'
            },
            {
                id: 'c3',
                title: '3. Payment',
                content: 'The Company shall pay the Contractor {{currency}} {{salary}} for the services rendered.',
                type: 'standard'
            }
        ]
    },
    {
        id: 'tpl-internship',
        name: 'Internship Agreement',
        category: 'Employment',
        type: 'internship',
        description: 'Educational internship agreement.',
        defaultClauses: [
            { id: 'c1', title: '1. Internship Program', content: 'The Intern will participate in the Company\'s internship program as {{employeePosition}}.', type: 'standard' },
            { id: 'c2', title: '2. Stipend', content: 'The Intern will receive a stipend of {{currency}} {{salary}}.', type: 'standard' }
        ]
    },
    {
        id: 'tpl-consulting',
        name: 'Consulting Services Agreement',
        category: 'Service',
        type: 'consulting',
        description: 'Professional consulting services contract.',
        defaultClauses: [
            { id: 'c1', title: '1. Services', content: 'Consultant shall provide expertise in the area of {{employeePosition}}.', type: 'standard' },
            { id: 'c2', title: '2. Fees', content: 'Client shall pay Consultant {{currency}} {{salary}}.', type: 'standard' }
        ]
    },
    {
        id: 'tpl-nda',
        name: 'Non-Disclosure Agreement',
        category: 'Legal',
        type: 'nda',
        description: 'Standard Unilateral NDA.',
        defaultClauses: [
            { id: 'c1', title: '1. Confidential Information', content: 'Confidential Information shall include all data, materials, products, technology, computer programs, specifications, manuals, business plans, software, marketing plans, business plans, financial information, and other information disclosed or submitted, orally, in writing, or by any other media, to Recipient by Disclosing Party.', type: 'standard' },
            { id: 'c2', title: '2. Obligations', content: 'Recipient agrees that it shall not use any Confidential Information for any purpose except for the Purpose.', type: 'standard' }
        ]
    }
]
