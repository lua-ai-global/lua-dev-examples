import { LuaTool, Data } from 'lua-cli';
import { z } from 'zod';
import { CompanySize } from '../../types/proposal.types.js';

export class CreateClientProfileTool implements LuaTool {
  name = 'create_client_profile';
  description = 'Capture client company info, contacts, pain points, budget, and timeline during discovery. Creates a searchable client profile.';

  inputSchema = z.object({
    companyName: z.string().describe('Company name'),
    industry: z.string().describe('Industry or vertical (e.g., Technology, Healthcare, Finance)'),
    companySize: z.string().describe('Company size: startup, small, medium, large, or enterprise'),
    contactName: z.string().describe('Primary contact full name'),
    contactTitle: z.string().describe('Primary contact job title'),
    contactEmail: z.string().describe('Primary contact email address'),
    contactPhone: z.string().optional().describe('Primary contact phone number'),
    painPoints: z.array(z.string()).min(1).describe('List of business pain points or challenges'),
    budget: z.string().optional().describe('Budget range or constraint (e.g., "$50k-$100k")'),
    timeline: z.string().optional().describe('Desired timeline (e.g., "Q2 2026", "3 months")'),
    notes: z.string().optional().describe('Additional discovery notes'),
    website: z.string().optional().describe('Company website URL'),
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    const clientData = {
      companyName: input.companyName,
      industry: input.industry,
      companySize: input.companySize,
      contacts: [
        {
          name: input.contactName,
          title: input.contactTitle,
          email: input.contactEmail,
          phone: input.contactPhone,
          isPrimary: true,
        },
      ],
      painPoints: input.painPoints,
      budget: input.budget,
      timeline: input.timeline,
      notes: input.notes,
      website: input.website,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const searchText = [
      input.companyName,
      input.industry,
      input.companySize,
      ...input.painPoints,
      input.notes,
    ].filter(Boolean).join(' ');

    const entry = await Data.create('clients', clientData, searchText);

    return {
      clientId: entry.id,
      companyName: input.companyName,
      message: `Client profile created for "${input.companyName}" in ${input.industry}.`,
    };
  }
}
