export interface Lead {
    id: string;
    name: string;
    status: string;
    notes: string[];
}

const mockDatabase: Record<string, Lead> = {
    'LEAD-101': { id: 'LEAD-101', name: 'Alice Smith', status: 'New', notes: [] },
    'LEAD-102': { id: 'LEAD-102', name: 'Bob Jones', status: 'Contacted', notes: [] },
};

export const db = {
    getLead: (id: string) => mockDatabase[id] || null,
    updateStatus: (id: string, status: string) => {
        if (mockDatabase[id]) {
            mockDatabase[id].status = status;
            return mockDatabase[id];
        }
        return null;
    },
    addNote: (id: string, note: string) => {
        if (mockDatabase[id]) {
            mockDatabase[id].notes.push(note);
            return mockDatabase[id];
        }
        return null;
    }
};
