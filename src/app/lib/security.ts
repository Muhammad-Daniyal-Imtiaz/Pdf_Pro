
export async function generateContractHash(content: string): Promise<string> {
    const msgBuffer = new TextEncoder().encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

export async function verifyContractHash(content: string, expectedHash: string): Promise<boolean> {
    const calculatedHash = await generateContractHash(content);
    return calculatedHash === expectedHash;
}
