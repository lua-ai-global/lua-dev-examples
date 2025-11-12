import axios, { AxiosInstance } from 'axios';

const AIRTABLE_API_BASE = 'https://api.airtable.com/v0';

export default class AirtableService {
  private client: AxiosInstance;
  private token: string;

  constructor(token: string) {
    if (!token) {
      throw new Error('Airtable token is required for AirtableService');
    }
    this.token = token;
    
    this.client = axios.create({
      baseURL: AIRTABLE_API_BASE,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async listRecords(params: {
    baseId: string;
    tableIdOrName: string;
    fields?: string[];
    filterByFormula?: string;
    maxRecords?: number;
    pageSize?: number;
    sort?: Array<{ field: string; direction: string }>;
    view?: string;
    offset?: string;
  }): Promise<{ 
    success: boolean; 
    records?: any[];
    offset?: string;
    error?: string;
  }> {
    try {
      const queryParams: any = {};
      
      if (params.fields && params.fields.length > 0) {
        queryParams.fields = params.fields;
      }
      
      if (params.filterByFormula) {
        queryParams.filterByFormula = params.filterByFormula;
      }
      
      if (params.maxRecords) {
        queryParams.maxRecords = params.maxRecords;
      }
      
      if (params.pageSize) {
        queryParams.pageSize = params.pageSize;
      }
      
      if (params.sort && params.sort.length > 0) {
        params.sort.forEach((sortItem, index) => {
          queryParams[`sort[${index}][field]`] = sortItem.field;
          queryParams[`sort[${index}][direction]`] = sortItem.direction;
        });
      }
      
      if (params.view) {
        queryParams.view = params.view;
      }
      
      if (params.offset) {
        queryParams.offset = params.offset;
      }

      const response = await this.client.get(
        `/${params.baseId}/${encodeURIComponent(params.tableIdOrName)}`,
        { params: queryParams }
      );

      return {
        success: true,
        records: response.data.records,
        offset: response.data.offset,
      };
    } catch (error: any) {
      console.error('Airtable List Records Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message,
      };
    }
  }

  async getRecord(params: {
    baseId: string;
    tableIdOrName: string;
    recordId: string;
    cellFormat?: string;
    returnFieldsByFieldId?: boolean;
    timeZone?: string;
    userLocale?: string;
  }): Promise<{ 
    success: boolean; 
    record?: any;
    error?: string;
  }> {
    try {
      const queryParams: any = {};
      
      if (params.cellFormat) {
        queryParams.cellFormat = params.cellFormat;
      }
      
      if (params.returnFieldsByFieldId !== undefined) {
        queryParams.returnFieldsByFieldId = params.returnFieldsByFieldId;
      }
      
      if (params.timeZone) {
        queryParams.timeZone = params.timeZone;
      }
      
      if (params.userLocale) {
        queryParams.userLocale = params.userLocale;
      }

      const response = await this.client.get(
        `/${params.baseId}/${encodeURIComponent(params.tableIdOrName)}/${params.recordId}`,
        { params: queryParams }
      );

      return {
        success: true,
        record: response.data,
      };
    } catch (error: any) {
      console.error('Airtable Get Record Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message,
      };
    }
  }

  async createRecords(params: {
    baseId: string;
    tableIdOrName: string;
    records: Array<{ fields: Record<string, any> }>;
    returnFieldsByFieldId?: boolean;
    typecast?: boolean;
  }): Promise<{ 
    success: boolean; 
    records?: any[];
    details?: any;
    error?: string;
  }> {
    try {
      const requestBody: any = {
        records: params.records,
      };
      
      if (params.returnFieldsByFieldId !== undefined) {
        requestBody.returnFieldsByFieldId = params.returnFieldsByFieldId;
      }
      
      if (params.typecast !== undefined) {
        requestBody.typecast = params.typecast;
      }

      const response = await this.client.post(
        `/${params.baseId}/${encodeURIComponent(params.tableIdOrName)}`,
        requestBody
      );

      return {
        success: true,
        records: response.data.records,
        details: response.data.details,
      };
    } catch (error: any) {
      console.error('Airtable Create Records Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message,
      };
    }
  }

  async deleteRecord(params: {
    baseId: string;
    tableIdOrName: string;
    recordId: string;
  }): Promise<{ 
    success: boolean; 
    id?: string;
    deleted?: boolean;
    error?: string;
  }> {
    try {
      const response = await this.client.delete(
        `/${params.baseId}/${encodeURIComponent(params.tableIdOrName)}/${params.recordId}`
      );

      return {
        success: true,
        id: response.data.id,
        deleted: response.data.deleted,
      };
    } catch (error: any) {
      console.error('Airtable Delete Record Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message,
      };
    }
  }

  async updateRecord(params: {
    baseId: string;
    tableIdOrName: string;
    recordId: string;
    fields: Record<string, any>;
    returnFieldsByFieldId?: boolean;
    typecast?: boolean;
  }): Promise<{ 
    success: boolean; 
    record?: any;
    details?: any;
    error?: string;
  }> {
    try {
      const requestBody: any = {
        fields: params.fields,
      };
      
      if (params.returnFieldsByFieldId !== undefined) {
        requestBody.returnFieldsByFieldId = params.returnFieldsByFieldId;
      }
      
      if (params.typecast !== undefined) {
        requestBody.typecast = params.typecast;
      }

      const response = await this.client.patch(
        `/${params.baseId}/${encodeURIComponent(params.tableIdOrName)}/${params.recordId}`,
        requestBody
      );

      return {
        success: true,
        record: response.data,
        details: response.data.details,
      };
    } catch (error: any) {
      console.error('Airtable Update Record Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message,
      };
    }
  }

  async createBase(params: {
    name: string;
    workspaceId: string;
    tables: Array<{
      name: string;
      description?: string;
      fields: Array<{
        name: string;
        type: string;
        description?: string;
        options?: Record<string, any>;
      }>;
    }>;
  }): Promise<{ 
    success: boolean; 
    id?: string;
    tables?: any[];
    error?: string;
  }> {
    try {
      const requestBody = {
        name: params.name,
        workspaceId: params.workspaceId,
        tables: params.tables,
      };

      const response = await this.client.post('/meta/bases', requestBody);

      return {
        success: true,
        id: response.data.id,
        tables: response.data.tables,
      };
    } catch (error: any) {
      console.error('Airtable Create Base Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message,
      };
    }
  }

  async listBases(params?: {
    offset?: string;
  }): Promise<{ 
    success: boolean; 
    bases?: Array<{
      id: string;
      name: string;
      permissionLevel: string;
    }>;
    offset?: string;
    error?: string;
  }> {
    try {
      const queryParams: any = {};
      
      if (params?.offset) {
        queryParams.offset = params.offset;
      }

      const response = await this.client.get('/meta/bases', {
        params: queryParams
      });

      return {
        success: true,
        bases: response.data.bases,
        offset: response.data.offset,
      };
    } catch (error: any) {
      console.error('Airtable List Bases Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message,
      };
    }
  }

  async createTable(params: {
    baseId: string;
    name: string;
    description?: string;
    fields: Array<{
      name: string;
      type: string;
      description?: string;
      options?: Record<string, any>;
    }>;
  }): Promise<{ 
    success: boolean; 
    table?: any;
    error?: string;
  }> {
    try {
      const requestBody: any = {
        name: params.name,
        fields: params.fields,
      };
      
      if (params.description) {
        requestBody.description = params.description;
      }

      const response = await this.client.post(
        `/meta/bases/${params.baseId}/tables`,
        requestBody
      );

      return {
        success: true,
        table: response.data,
      };
    } catch (error: any) {
      console.error('Airtable Create Table Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message,
      };
    }
  }

  async updateTable(params: {
    baseId: string;
    tableIdOrName: string;
    name?: string;
    description?: string;
    dateDependencySettings?: Record<string, any>;
  }): Promise<{ 
    success: boolean; 
    table?: any;
    error?: string;
  }> {
    try {
      const requestBody: any = {};
      
      if (params.name !== undefined) {
        requestBody.name = params.name;
      }
      
      if (params.description !== undefined) {
        requestBody.description = params.description;
      }
      
      if (params.dateDependencySettings !== undefined) {
        requestBody.dateDependencySettings = params.dateDependencySettings;
      }

      const response = await this.client.patch(
        `/meta/bases/${params.baseId}/tables/${encodeURIComponent(params.tableIdOrName)}`,
        requestBody
      );

      return {
        success: true,
        table: response.data,
      };
    } catch (error: any) {
      console.error('Airtable Update Table Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message,
      };
    }
  }

  async createField(params: {
    baseId: string;
    tableId: string;
    name: string;
    type: string;
    description?: string;
    options?: Record<string, any>;
  }): Promise<{ 
    success: boolean; 
    field?: any;
    error?: string;
  }> {
    try {
      const requestBody: any = {
        name: params.name,
        type: params.type,
      };
      
      if (params.description) {
        requestBody.description = params.description;
      }
      
      if (params.options) {
        requestBody.options = params.options;
      }

      const response = await this.client.post(
        `/meta/bases/${params.baseId}/tables/${params.tableId}/fields`,
        requestBody
      );

      return {
        success: true,
        field: response.data,
      };
    } catch (error: any) {
      console.error('Airtable Create Field Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message,
      };
    }
  }

  async updateField(params: {
    baseId: string;
    tableId: string;
    fieldId: string;
    name?: string;
    description?: string;
  }): Promise<{ 
    success: boolean; 
    field?: any;
    error?: string;
  }> {
    try {
      const requestBody: any = {};
      
      if (params.name !== undefined) {
        requestBody.name = params.name;
      }
      
      if (params.description !== undefined) {
        requestBody.description = params.description;
      }

      const response = await this.client.patch(
        `/meta/bases/${params.baseId}/tables/${params.tableId}/fields/${params.fieldId}`,
        requestBody
      );

      return {
        success: true,
        field: response.data,
      };
    } catch (error: any) {
      console.error('Airtable Update Field Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message,
      };
    }
  }
}

