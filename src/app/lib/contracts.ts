import { nanoid } from 'nanoid'

export interface Contract {
    id: string
    title: string
    clientName: string
    status: 'draft' | 'pending' | 'signed'
    createdAt: string
    content: string
    signatures?: {
        client?: string
        provider?: string
    }
}

export interface ContractTemplate {
    id: string
    name: string
    content: string
    category: string
}

export const contractTemplates: ContractTemplate[] = [
    {
        id: 'freelance-web',
        name: 'Freelance Web Development',
        category: 'Development',
        content: `CONTRACT FOR WEB DEVELOPMENT SERVICES...`
    },
    {
        id: 'nda-generic',
        name: 'Non-Disclosure Agreement',
        category: 'Legal',
        content: `NON-DISCLOSURE AGREEMENT...`
    },
    {
        id: 'consulting',
        name: 'Consulting Agreement',
        category: 'Business',
        content: `CONSULTING AGREEMENT...`
    }
]

const STORAGE_KEY = 'contracts_data_enc'
const IV_LENGTH = 12
const SALT_LENGTH = 16

// Encryption Utilities
async function getKey(salt: Uint8Array): Promise<CryptoKey> {
    const enc = new TextEncoder()
    const keyMaterial = await window.crypto.subtle.importKey(
        'raw',
        enc.encode('user-secret-key-placeholder'), // In a real app, this should be a user-derived secret or fetched securely
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
    )
    return window.crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt,
            iterations: 100000,
            hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    )
}

async function encryptData(data: any): Promise<string> {
    const salt = window.crypto.getRandomValues(new Uint8Array(SALT_LENGTH))
    const iv = window.crypto.getRandomValues(new Uint8Array(IV_LENGTH))
    const key = await getKey(salt)
    const encoded = new TextEncoder().encode(JSON.stringify(data))

    const encrypted = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        encoded
    )

    const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength)
    combined.set(salt)
    combined.set(iv, salt.length)
    combined.set(new Uint8Array(encrypted), salt.length + iv.length)

    return btoa(String.fromCharCode(...combined))
}

async function decryptData<T>(encryptedString: string): Promise<T | null> {
    try {
        const combined = new Uint8Array(
            atob(encryptedString).split('').map(c => c.charCodeAt(0))
        )

        const salt = combined.slice(0, SALT_LENGTH)
        const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH)
        const data = combined.slice(SALT_LENGTH + IV_LENGTH)

        const key = await getKey(salt)
        const decrypted = await window.crypto.subtle.decrypt(
            { name: 'AES-GCM', iv },
            key,
            data
        )

        return JSON.parse(new TextDecoder().decode(decrypted))
    } catch (e) {
        console.error('Failed to decrypt data', e)
        return null
    }
}

export class ContractService {
    static async getContracts(): Promise<Contract[]> {
        if (typeof window === 'undefined') return []
        const stored = localStorage.getItem(STORAGE_KEY)
        if (!stored) return []
        return (await decryptData<Contract[]>(stored)) || []
    }

    static async saveContract(contract: Contract): Promise<void> {
        const contracts = await this.getContracts()
        const index = contracts.findIndex(c => c.id === contract.id)

        if (index >= 0) {
            contracts[index] = contract
        } else {
            contracts.push(contract)
        }

        if (typeof window !== 'undefined') {
            const encrypted = await encryptData(contracts)
            localStorage.setItem(STORAGE_KEY, encrypted)
        }
    }

    static async createContract(templateId: string, clientName: string): Promise<Contract> {
        const template = contractTemplates.find(t => t.id === templateId)
        if (!template) throw new Error('Template not found')

        const newContract: Contract = {
            id: nanoid(),
            title: `${template.name} - ${clientName}`,
            clientName,
            status: 'draft',
            createdAt: new Date().toISOString(),
            content: template.content
        }

        await this.saveContract(newContract)
        return newContract
    }

    static async deleteContract(id: string): Promise<void> {
        const contracts = await this.getContracts()
        const filtered = contracts.filter(c => c.id !== id)

        if (typeof window !== 'undefined') {
            const encrypted = await encryptData(filtered)
            localStorage.setItem(STORAGE_KEY, encrypted)
        }
    }

    static async getContract(id: string): Promise<Contract | undefined> {
        const contracts = await this.getContracts()
        return contracts.find(c => c.id === id)
    }
}
