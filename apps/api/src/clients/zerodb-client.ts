export interface ZeroDBConfig {
  baseUrl: string;
  apiKey: string;
  projectId: string;
}

export interface ZeroDBQueryOptions {
  filters?: Array<{
    field: string;
    operator: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "like" | "in";
    value: unknown;
  }>;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  limit?: number;
  offset?: number;
}

export interface ZeroDBResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ZeroDBRowResponse {
  id: string;
  row_data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export class ZeroDBClient {
  private baseUrl: string;
  private apiKey: string;
  private projectId: string;

  constructor(config: ZeroDBConfig) {
    this.baseUrl = config.baseUrl.replace(/\/+$/, "");
    this.apiKey = config.apiKey;
    this.projectId = config.projectId;
  }

  private get headers(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      "X-API-Key": this.apiKey,
    };
  }

  private tableUrl(table: string): string {
    return `${this.baseUrl}/api/v1/projects/${this.projectId}/database/tables/${table}`;
  }

  async createRow(
    table: string,
    rowData: Record<string, unknown>
  ): Promise<ZeroDBRowResponse> {
    const response = await fetch(`${this.tableUrl(table)}/rows`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify({ row_data: rowData }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`ZeroDB createRow failed (${response.status}): ${error}`);
    }

    const result = (await response.json()) as ZeroDBResponse<ZeroDBRowResponse>;
    return result.data;
  }

  async getRow(table: string, id: string): Promise<ZeroDBRowResponse | null> {
    const response = await fetch(`${this.tableUrl(table)}/rows/${id}`, {
      method: "GET",
      headers: this.headers,
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`ZeroDB getRow failed (${response.status}): ${error}`);
    }

    const result = (await response.json()) as ZeroDBResponse<ZeroDBRowResponse>;
    return result.data;
  }

  async updateRow(
    table: string,
    id: string,
    rowData: Record<string, unknown>
  ): Promise<ZeroDBRowResponse> {
    const response = await fetch(`${this.tableUrl(table)}/rows/${id}`, {
      method: "PATCH",
      headers: this.headers,
      body: JSON.stringify({ row_data: rowData }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`ZeroDB updateRow failed (${response.status}): ${error}`);
    }

    const result = (await response.json()) as ZeroDBResponse<ZeroDBRowResponse>;
    return result.data;
  }

  async queryRows(
    table: string,
    options: ZeroDBQueryOptions = {}
  ): Promise<ZeroDBRowResponse[]> {
    const response = await fetch(`${this.tableUrl(table)}/rows/query`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify(options),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(
        `ZeroDB queryRows failed (${response.status}): ${error}`
      );
    }

    const result = (await response.json()) as ZeroDBResponse<ZeroDBRowResponse[]>;
    return result.data;
  }

  async deleteRow(table: string, id: string): Promise<void> {
    const response = await fetch(`${this.tableUrl(table)}/rows/${id}`, {
      method: "DELETE",
      headers: this.headers,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(
        `ZeroDB deleteRow failed (${response.status}): ${error}`
      );
    }
  }
}
