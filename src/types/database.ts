export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type CovenantType = "leverage" | "interest_coverage" | "fixed_charge_coverage" | "current_ratio" | "min_net_worth" | "custom";
export type CovenantOperator = "max" | "min";
export type ComplianceStatus = "compliant" | "warning" | "breach" | "pending";
export type AlertSeverity = "info" | "warning" | "critical";
export type DocumentType = "credit_agreement" | "compliance_certificate" | "financial_statement" | "amendment" | "other";
export type ExtractionStatus = "pending" | "processing" | "completed" | "failed" | "needs_review";

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
      };
      users: {
        Row: {
          id: string;
          clerk_id: string;
          email: string;
          full_name: string | null;
          organization_id: string;
          role: string;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          clerk_id: string;
          email: string;
          full_name?: string | null;
          organization_id: string;
          role?: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          clerk_id?: string;
          email?: string;
          full_name?: string | null;
          organization_id?: string;
          role?: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
      };
      borrowers: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          industry: string | null;
          rating: string | null;
          metadata: Json | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          industry?: string | null;
          rating?: string | null;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          industry?: string | null;
          rating?: string | null;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
      };
      loans: {
        Row: {
          id: string;
          organization_id: string;
          borrower_id: string;
          name: string;
          facility_type: string;
          commitment_amount: number;
          outstanding_amount: number;
          currency: string;
          origination_date: string;
          maturity_date: string;
          interest_rate: number | null;
          interest_rate_type: string | null;
          status: string;
          metadata: Json | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          borrower_id: string;
          name: string;
          facility_type: string;
          commitment_amount: number;
          outstanding_amount?: number;
          currency?: string;
          origination_date: string;
          maturity_date: string;
          interest_rate?: number | null;
          interest_rate_type?: string | null;
          status?: string;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          organization_id?: string;
          borrower_id?: string;
          name?: string;
          facility_type?: string;
          commitment_amount?: number;
          outstanding_amount?: number;
          currency?: string;
          origination_date?: string;
          maturity_date?: string;
          interest_rate?: number | null;
          interest_rate_type?: string | null;
          status?: string;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
      };
      documents: {
        Row: {
          id: string;
          organization_id: string;
          loan_id: string;
          type: DocumentType;
          name: string;
          file_path: string;
          file_size: number;
          mime_type: string;
          extraction_status: ExtractionStatus;
          extracted_data: Json | null;
          confidence_scores: Json | null;
          uploaded_by: string;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          loan_id: string;
          type: DocumentType;
          name: string;
          file_path: string;
          file_size: number;
          mime_type: string;
          extraction_status?: ExtractionStatus;
          extracted_data?: Json | null;
          confidence_scores?: Json | null;
          uploaded_by: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          organization_id?: string;
          loan_id?: string;
          type?: DocumentType;
          name?: string;
          file_path?: string;
          file_size?: number;
          mime_type?: string;
          extraction_status?: ExtractionStatus;
          extracted_data?: Json | null;
          confidence_scores?: Json | null;
          uploaded_by?: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
      };
      covenants: {
        Row: {
          id: string;
          loan_id: string;
          name: string;
          type: CovenantType;
          operator: CovenantOperator;
          threshold: number;
          threshold_step_downs: Json | null;
          ebitda_definition: string | null;
          ebitda_addbacks: Json | null;
          testing_frequency: string;
          grace_period_days: number;
          source_document_id: string | null;
          source_clause: string | null;
          metadata: Json | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          loan_id: string;
          name: string;
          type: CovenantType;
          operator: CovenantOperator;
          threshold: number;
          threshold_step_downs?: Json | null;
          ebitda_definition?: string | null;
          ebitda_addbacks?: Json | null;
          testing_frequency?: string;
          grace_period_days?: number;
          source_document_id?: string | null;
          source_clause?: string | null;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          loan_id?: string;
          name?: string;
          type?: CovenantType;
          operator?: CovenantOperator;
          threshold?: number;
          threshold_step_downs?: Json | null;
          ebitda_definition?: string | null;
          ebitda_addbacks?: Json | null;
          testing_frequency?: string;
          grace_period_days?: number;
          source_document_id?: string | null;
          source_clause?: string | null;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
      };
      financial_periods: {
        Row: {
          id: string;
          loan_id: string;
          period_end_date: string;
          period_type: string;
          revenue: number | null;
          ebitda_reported: number | null;
          ebitda_adjusted: number | null;
          total_debt: number | null;
          interest_expense: number | null;
          fixed_charges: number | null;
          current_assets: number | null;
          current_liabilities: number | null;
          net_worth: number | null;
          addbacks_applied: Json | null;
          source_document_id: string | null;
          verified: boolean;
          verified_by: string | null;
          verified_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          loan_id: string;
          period_end_date: string;
          period_type: string;
          revenue?: number | null;
          ebitda_reported?: number | null;
          ebitda_adjusted?: number | null;
          total_debt?: number | null;
          interest_expense?: number | null;
          fixed_charges?: number | null;
          current_assets?: number | null;
          current_liabilities?: number | null;
          net_worth?: number | null;
          addbacks_applied?: Json | null;
          source_document_id?: string | null;
          verified?: boolean;
          verified_by?: string | null;
          verified_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          loan_id?: string;
          period_end_date?: string;
          period_type?: string;
          revenue?: number | null;
          ebitda_reported?: number | null;
          ebitda_adjusted?: number | null;
          total_debt?: number | null;
          interest_expense?: number | null;
          fixed_charges?: number | null;
          current_assets?: number | null;
          current_liabilities?: number | null;
          net_worth?: number | null;
          addbacks_applied?: Json | null;
          source_document_id?: string | null;
          verified?: boolean;
          verified_by?: string | null;
          verified_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      covenant_tests: {
        Row: {
          id: string;
          covenant_id: string;
          financial_period_id: string;
          calculated_value: number;
          threshold_at_test: number;
          status: ComplianceStatus;
          headroom_absolute: number | null;
          headroom_percentage: number | null;
          calculation_details: Json | null;
          notes: string | null;
          tested_by: string | null;
          tested_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          covenant_id: string;
          financial_period_id: string;
          calculated_value: number;
          threshold_at_test: number;
          status: ComplianceStatus;
          headroom_absolute?: number | null;
          headroom_percentage?: number | null;
          calculation_details?: Json | null;
          notes?: string | null;
          tested_by?: string | null;
          tested_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          covenant_id?: string;
          financial_period_id?: string;
          calculated_value?: number;
          threshold_at_test?: number;
          status?: ComplianceStatus;
          headroom_absolute?: number | null;
          headroom_percentage?: number | null;
          calculation_details?: Json | null;
          notes?: string | null;
          tested_by?: string | null;
          tested_at?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      alerts: {
        Row: {
          id: string;
          organization_id: string;
          loan_id: string;
          covenant_id: string | null;
          covenant_test_id: string | null;
          severity: AlertSeverity;
          title: string;
          message: string;
          acknowledged: boolean;
          acknowledged_by: string | null;
          acknowledged_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          loan_id: string;
          covenant_id?: string | null;
          covenant_test_id?: string | null;
          severity: AlertSeverity;
          title: string;
          message: string;
          acknowledged?: boolean;
          acknowledged_by?: string | null;
          acknowledged_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          loan_id?: string;
          covenant_id?: string | null;
          covenant_test_id?: string | null;
          severity?: AlertSeverity;
          title?: string;
          message?: string;
          acknowledged?: boolean;
          acknowledged_by?: string | null;
          acknowledged_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      memos: {
        Row: {
          id: string;
          organization_id: string;
          loan_id: string;
          title: string;
          content: string;
          generated_by_ai: boolean;
          ai_prompt: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          loan_id: string;
          title: string;
          content: string;
          generated_by_ai?: boolean;
          ai_prompt?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          organization_id?: string;
          loan_id?: string;
          title?: string;
          content?: string;
          generated_by_ai?: boolean;
          ai_prompt?: string | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string;
          changes: Json | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id?: string | null;
          action: string;
          entity_type: string;
          entity_id: string;
          changes?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          user_id?: string | null;
          action?: string;
          entity_type?: string;
          entity_id?: string;
          changes?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      covenant_type: CovenantType;
      covenant_operator: CovenantOperator;
      compliance_status: ComplianceStatus;
      alert_severity: AlertSeverity;
      document_type: DocumentType;
      extraction_status: ExtractionStatus;
    };
  };
}

// Helper types for easier use
export type Organization = Database["public"]["Tables"]["organizations"]["Row"];
export type User = Database["public"]["Tables"]["users"]["Row"];
export type Borrower = Database["public"]["Tables"]["borrowers"]["Row"];
export type Loan = Database["public"]["Tables"]["loans"]["Row"];
export type Document = Database["public"]["Tables"]["documents"]["Row"];
export type Covenant = Database["public"]["Tables"]["covenants"]["Row"];
export type FinancialPeriod = Database["public"]["Tables"]["financial_periods"]["Row"];
export type CovenantTest = Database["public"]["Tables"]["covenant_tests"]["Row"];
export type Alert = Database["public"]["Tables"]["alerts"]["Row"];
export type Memo = Database["public"]["Tables"]["memos"]["Row"];
export type AuditLog = Database["public"]["Tables"]["audit_logs"]["Row"];

// Insert types
export type OrganizationInsert = Database["public"]["Tables"]["organizations"]["Insert"];
export type UserInsert = Database["public"]["Tables"]["users"]["Insert"];
export type BorrowerInsert = Database["public"]["Tables"]["borrowers"]["Insert"];
export type LoanInsert = Database["public"]["Tables"]["loans"]["Insert"];
export type DocumentInsert = Database["public"]["Tables"]["documents"]["Insert"];
export type CovenantInsert = Database["public"]["Tables"]["covenants"]["Insert"];
export type FinancialPeriodInsert = Database["public"]["Tables"]["financial_periods"]["Insert"];
export type CovenantTestInsert = Database["public"]["Tables"]["covenant_tests"]["Insert"];
export type AlertInsert = Database["public"]["Tables"]["alerts"]["Insert"];
export type MemoInsert = Database["public"]["Tables"]["memos"]["Insert"];

// Loan with relations
export interface LoanWithRelations extends Loan {
  borrower?: Borrower;
  covenants?: Covenant[];
  documents?: Document[];
  financial_periods?: FinancialPeriod[];
  alerts?: Alert[];
}

// Covenant with test results
export interface CovenantWithTests extends Covenant {
  covenant_tests?: CovenantTest[];
  latest_test?: CovenantTest;
}
