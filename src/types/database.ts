export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action_type: string
          case_id: string | null
          description: string | null
          id: string
          role: string | null
          timestamp: string
          user_id: string | null
        }
        Insert: {
          action_type: string
          case_id?: string | null
          description?: string | null
          id?: string
          role?: string | null
          timestamp?: string
          user_id?: string | null
        }
        Update: {
          action_type?: string
          case_id?: string | null
          description?: string | null
          id?: string
          role?: string | null
          timestamp?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      applicants: {
        Row: {
          case_id: string
          created_at: string
          date_of_birth: string
          first_name: string
          id: string
          last_name: string
          middle_name: string | null
          updated_at: string
        }
        Insert: {
          case_id: string
          created_at?: string
          date_of_birth: string
          first_name: string
          id?: string
          last_name: string
          middle_name?: string | null
          updated_at?: string
        }
        Update: {
          case_id?: string
          created_at?: string
          date_of_birth?: string
          first_name?: string
          id?: string
          last_name?: string
          middle_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "applicants_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      cases: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          status: Database["public"]["Enums"]["case_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          status?: Database["public"]["Enums"]["case_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          status?: Database["public"]["Enums"]["case_status"]
          updated_at?: string
        }
        Relationships: []
      }
      comparison_results: {
        Row: {
          case_id: string
          comparison_scope: string
          created_at: string
          explanation: string | null
          field_name: string
          id: string
          left_document_id: string | null
          left_normalized: string | null
          left_value: string | null
          method: string
          right_document_id: string | null
          right_normalized: string | null
          right_value: string | null
          rule_code: string
          severity: string
          status: string
        }
        Insert: {
          case_id: string
          comparison_scope: string
          created_at?: string
          explanation?: string | null
          field_name: string
          id?: string
          left_document_id?: string | null
          left_normalized?: string | null
          left_value?: string | null
          method?: string
          right_document_id?: string | null
          right_normalized?: string | null
          right_value?: string | null
          rule_code: string
          severity?: string
          status?: string
        }
        Update: {
          case_id?: string
          comparison_scope?: string
          created_at?: string
          explanation?: string | null
          field_name?: string
          id?: string
          left_document_id?: string | null
          left_normalized?: string | null
          left_value?: string | null
          method?: string
          right_document_id?: string | null
          right_normalized?: string | null
          right_value?: string | null
          rule_code?: string
          severity?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "comparison_results_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comparison_results_left_document_id_fkey"
            columns: ["left_document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comparison_results_right_document_id_fkey"
            columns: ["right_document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      document_extractions: {
        Row: {
          case_id: string
          confidence_score: number | null
          created_at: string
          document_id: string
          document_quality: string | null
          document_type: string
          error_message: string | null
          extraction_method: string | null
          id: string
          model_used: string | null
          notes: string | null
          ocr_engine: string | null
          ocr_text: string | null
          page_count: number | null
          processing_duration_ms: number | null
          raw_text: string | null
          retry_count: number | null
          review_status: Database["public"]["Enums"]["extraction_review_status"]
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["extraction_status"]
          uncertain_field_count: number | null
          updated_at: string
        }
        Insert: {
          case_id: string
          confidence_score?: number | null
          created_at?: string
          document_id: string
          document_quality?: string | null
          document_type: string
          error_message?: string | null
          extraction_method?: string | null
          id?: string
          model_used?: string | null
          notes?: string | null
          ocr_engine?: string | null
          ocr_text?: string | null
          page_count?: number | null
          processing_duration_ms?: number | null
          raw_text?: string | null
          retry_count?: number | null
          review_status?: Database["public"]["Enums"]["extraction_review_status"]
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["extraction_status"]
          uncertain_field_count?: number | null
          updated_at?: string
        }
        Update: {
          case_id?: string
          confidence_score?: number | null
          created_at?: string
          document_id?: string
          document_quality?: string | null
          document_type?: string
          error_message?: string | null
          extraction_method?: string | null
          id?: string
          model_used?: string | null
          notes?: string | null
          ocr_engine?: string | null
          ocr_text?: string | null
          page_count?: number | null
          processing_duration_ms?: number | null
          raw_text?: string | null
          retry_count?: number | null
          review_status?: Database["public"]["Enums"]["extraction_review_status"]
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["extraction_status"]
          uncertain_field_count?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_extractions_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_extractions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      document_fields: {
        Row: {
          bounding_box: Json | null
          case_id: string
          confidence_score: number | null
          created_at: string
          document_extraction_id: string
          document_id: string
          evidence_status: string | null
          field_name: string
          final_value: string | null
          id: string
          normalized_value: string | null
          ocr_confidence: number | null
          page_number: number | null
          raw_value: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          reviewed_value: string | null
          source_text: string | null
          state: string | null
          status: Database["public"]["Enums"]["field_status"]
          updated_at: string
        }
        Insert: {
          bounding_box?: Json | null
          case_id: string
          confidence_score?: number | null
          created_at?: string
          document_extraction_id: string
          document_id: string
          evidence_status?: string | null
          field_name: string
          final_value?: string | null
          id?: string
          normalized_value?: string | null
          ocr_confidence?: number | null
          page_number?: number | null
          raw_value?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewed_value?: string | null
          source_text?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["field_status"]
          updated_at?: string
        }
        Update: {
          bounding_box?: Json | null
          case_id?: string
          confidence_score?: number | null
          created_at?: string
          document_extraction_id?: string
          document_id?: string
          evidence_status?: string | null
          field_name?: string
          final_value?: string | null
          id?: string
          normalized_value?: string | null
          ocr_confidence?: number | null
          page_number?: number | null
          raw_value?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewed_value?: string | null
          source_text?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["field_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_fields_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_fields_document_extraction_id_fkey"
            columns: ["document_extraction_id"]
            isOneToOne: false
            referencedRelation: "document_extractions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_fields_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          case_id: string
          created_at: string
          file_name: string
          file_path: string
          file_size: number
          id: string
          mime_type: string
          owner_type: string
          sponsor_id: string | null
          status: string
          type: string
          updated_at: string
          uploaded_by: string
        }
        Insert: {
          case_id: string
          created_at?: string
          file_name: string
          file_path: string
          file_size: number
          id?: string
          mime_type: string
          owner_type?: string
          sponsor_id?: string | null
          status?: string
          type: string
          updated_at?: string
          uploaded_by?: string
        }
        Update: {
          case_id?: string
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number
          id?: string
          mime_type?: string
          owner_type?: string
          sponsor_id?: string | null
          status?: string
          type?: string
          updated_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "sponsors"
            referencedColumns: ["id"]
          },
        ]
      }
      draft_findings: {
        Row: {
          draft_id: string
          finding_id: string
        }
        Insert: {
          draft_id: string
          finding_id: string
        }
        Update: {
          draft_id?: string
          finding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "draft_findings_draft_id_fkey"
            columns: ["draft_id"]
            isOneToOne: false
            referencedRelation: "generated_drafts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "draft_findings_finding_id_fkey"
            columns: ["finding_id"]
            isOneToOne: false
            referencedRelation: "findings"
            referencedColumns: ["id"]
          },
        ]
      }
      export_packages: {
        Row: {
          case_id: string | null
          created_at: string
          deleted_at: string | null
          docx_path: string | null
          generated_at: string | null
          generated_by: string | null
          id: string
          pdf_path: string | null
          status: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          case_id?: string | null
          created_at?: string
          deleted_at?: string | null
          docx_path?: string | null
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          pdf_path?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          case_id?: string | null
          created_at?: string
          deleted_at?: string | null
          docx_path?: string | null
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          pdf_path?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "export_packages_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      field_evidence: {
        Row: {
          created_at: string
          document_field_id: string
          evidence_role: string | null
          id: string
          ocr_span_id: string
        }
        Insert: {
          created_at?: string
          document_field_id: string
          evidence_role?: string | null
          id?: string
          ocr_span_id: string
        }
        Update: {
          created_at?: string
          document_field_id?: string
          evidence_role?: string | null
          id?: string
          ocr_span_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "field_evidence_document_field_id_fkey"
            columns: ["document_field_id"]
            isOneToOne: false
            referencedRelation: "document_fields"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "field_evidence_ocr_span_id_fkey"
            columns: ["ocr_span_id"]
            isOneToOne: false
            referencedRelation: "ocr_spans"
            referencedColumns: ["id"]
          },
        ]
      }
      finding_documents: {
        Row: {
          document_id: string
          finding_id: string
        }
        Insert: {
          document_id: string
          finding_id: string
        }
        Update: {
          document_id?: string
          finding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "finding_documents_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finding_documents_finding_id_fkey"
            columns: ["finding_id"]
            isOneToOne: false
            referencedRelation: "findings"
            referencedColumns: ["id"]
          },
        ]
      }
      finding_field_references: {
        Row: {
          created_at: string
          document_field_id: string
          document_id: string
          finding_id: string
          id: string
          role: Database["public"]["Enums"]["finding_field_role"]
        }
        Insert: {
          created_at?: string
          document_field_id: string
          document_id: string
          finding_id: string
          id?: string
          role: Database["public"]["Enums"]["finding_field_role"]
        }
        Update: {
          created_at?: string
          document_field_id?: string
          document_id?: string
          finding_id?: string
          id?: string
          role?: Database["public"]["Enums"]["finding_field_role"]
        }
        Relationships: [
          {
            foreignKeyName: "finding_field_references_document_field_id_fkey"
            columns: ["document_field_id"]
            isOneToOne: false
            referencedRelation: "document_fields"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finding_field_references_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finding_field_references_finding_id_fkey"
            columns: ["finding_id"]
            isOneToOne: false
            referencedRelation: "findings"
            referencedColumns: ["id"]
          },
        ]
      }
      findings: {
        Row: {
          case_id: string
          category: Database["public"]["Enums"]["finding_category"]
          created_at: string
          description: string
          finding_scope: string
          id: string
          severity: Database["public"]["Enums"]["finding_severity"]
          status: Database["public"]["Enums"]["finding_status"]
          title: string
          updated_at: string
          verification_stage: string | null
        }
        Insert: {
          case_id: string
          category: Database["public"]["Enums"]["finding_category"]
          created_at?: string
          description: string
          finding_scope?: string
          id?: string
          severity: Database["public"]["Enums"]["finding_severity"]
          status?: Database["public"]["Enums"]["finding_status"]
          title: string
          updated_at?: string
          verification_stage?: string | null
        }
        Update: {
          case_id?: string
          category?: Database["public"]["Enums"]["finding_category"]
          created_at?: string
          description?: string
          finding_scope?: string
          id?: string
          severity?: Database["public"]["Enums"]["finding_severity"]
          status?: Database["public"]["Enums"]["finding_status"]
          title?: string
          updated_at?: string
          verification_stage?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "findings_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_drafts: {
        Row: {
          case_id: string | null
          content: string
          created_at: string
          deleted_at: string | null
          id: string
          status: Database["public"]["Enums"]["draft_status"]
          type: Database["public"]["Enums"]["draft_type"]
          updated_at: string
        }
        Insert: {
          case_id?: string | null
          content?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          status?: Database["public"]["Enums"]["draft_status"]
          type?: Database["public"]["Enums"]["draft_type"]
          updated_at?: string
        }
        Update: {
          case_id?: string | null
          content?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          status?: Database["public"]["Enums"]["draft_status"]
          type?: Database["public"]["Enums"]["draft_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "generated_drafts_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      ocr_pages: {
        Row: {
          created_at: string
          extraction_id: string
          height: number | null
          id: string
          page_number: number
          provider_metadata: Json | null
          width: number | null
        }
        Insert: {
          created_at?: string
          extraction_id: string
          height?: number | null
          id?: string
          page_number: number
          provider_metadata?: Json | null
          width?: number | null
        }
        Update: {
          created_at?: string
          extraction_id?: string
          height?: number | null
          id?: string
          page_number?: number
          provider_metadata?: Json | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ocr_pages_extraction_id_fkey"
            columns: ["extraction_id"]
            isOneToOne: false
            referencedRelation: "document_extractions"
            referencedColumns: ["id"]
          },
        ]
      }
      ocr_spans: {
        Row: {
          block_type: string | null
          bounding_box: Json | null
          created_at: string
          extraction_id: string
          id: string
          normalized_text: string
          ocr_confidence: number | null
          page_id: string
          text: string
        }
        Insert: {
          block_type?: string | null
          bounding_box?: Json | null
          created_at?: string
          extraction_id: string
          id: string
          normalized_text: string
          ocr_confidence?: number | null
          page_id: string
          text: string
        }
        Update: {
          block_type?: string | null
          bounding_box?: Json | null
          created_at?: string
          extraction_id?: string
          id?: string
          normalized_text?: string
          ocr_confidence?: number | null
          page_id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "ocr_spans_extraction_id_fkey"
            columns: ["extraction_id"]
            isOneToOne: false
            referencedRelation: "document_extractions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ocr_spans_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "ocr_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      relationship_evidence: {
        Row: {
          created_at: string
          document_id: string | null
          evidence_role: string
          extracted_value: string | null
          field_name: string
          id: string
          normalized_value: string | null
          sponsor_relationship_id: string
        }
        Insert: {
          created_at?: string
          document_id?: string | null
          evidence_role?: string
          extracted_value?: string | null
          field_name: string
          id?: string
          normalized_value?: string | null
          sponsor_relationship_id: string
        }
        Update: {
          created_at?: string
          document_id?: string | null
          evidence_role?: string
          extracted_value?: string | null
          field_name?: string
          id?: string
          normalized_value?: string | null
          sponsor_relationship_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "relationship_evidence_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "relationship_evidence_sponsor_relationship_id_fkey"
            columns: ["sponsor_relationship_id"]
            isOneToOne: false
            referencedRelation: "sponsor_relationships"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsor_relationships: {
        Row: {
          case_id: string
          confidence: number
          created_at: string
          declared_relationship: string
          id: string
          missing_evidence: Json | null
          review_notes: string | null
          sponsor_id: string
          updated_at: string
          verification_status: string
          verified_relationship: string | null
        }
        Insert: {
          case_id: string
          confidence?: number
          created_at?: string
          declared_relationship: string
          id?: string
          missing_evidence?: Json | null
          review_notes?: string | null
          sponsor_id: string
          updated_at?: string
          verification_status?: string
          verified_relationship?: string | null
        }
        Update: {
          case_id?: string
          confidence?: number
          created_at?: string
          declared_relationship?: string
          id?: string
          missing_evidence?: Json | null
          review_notes?: string | null
          sponsor_id?: string
          updated_at?: string
          verification_status?: string
          verified_relationship?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sponsor_relationships_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsor_relationships_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "sponsors"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsors: {
        Row: {
          case_id: string
          created_at: string
          first_name: string
          id: string
          last_name: string
          relationship: string
        }
        Insert: {
          case_id: string
          created_at?: string
          first_name: string
          id?: string
          last_name: string
          relationship: string
        }
        Update: {
          case_id?: string
          created_at?: string
          first_name?: string
          id?: string
          last_name?: string
          relationship?: string
        }
        Relationships: [
          {
            foreignKeyName: "sponsors_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          role: string
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          created_at?: string
          role: string
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          created_at?: string
          role?: string
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_sponsor_to_case: {
        Args: {
          p_case_id: string
          p_first_name: string
          p_last_name: string
          p_relationship: string
        }
        Returns: string
      }
      create_case_with_applicant:
        | {
            Args: {
              p_date_of_birth: string
              p_first_name: string
              p_last_name: string
            }
            Returns: string
          }
        | {
            Args: {
              p_date_of_birth: string
              p_first_name: string
              p_last_name: string
              p_middle_name?: string
            }
            Returns: string
          }
        | {
            Args: {
              p_date_of_birth: string
              p_first_name: string
              p_last_name: string
              p_role: string
              p_user_id: string
            }
            Returns: string
          }
      create_employee_account: {
        Args: {
          p_email: string
          p_password: string
          p_role: string
          p_username: string
        }
        Returns: Json
      }
      delete_document: { Args: { p_document_id: string }; Returns: undefined }
      delete_employee_account: { Args: { p_user_id: string }; Returns: Json }
      get_all_employees: {
        Args: never
        Returns: {
          created_at: string
          email: string
          role: string
          user_id: string
          username: string
        }[]
      }
      get_dashboard_analytics: {
        Args: { p_end_date?: string; p_start_date?: string }
        Returns: Json
      }
      get_email_by_username: { Args: { p_username: string }; Returns: string }
      get_user_role: { Args: never; Returns: string }
      replace_document_extraction_data: {
        Args: { p_extraction_id: string }
        Returns: undefined
      }
      upload_document_record: {
        Args: {
          p_case_id: string
          p_file_name: string
          p_file_path: string
          p_file_size: number
          p_mime_type: string
          p_type: string
        }
        Returns: string
      }
      verify_document_field: {
        Args: {
          p_action: string
          p_corrected_value?: string
          p_field_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      case_status:
        | "Draft"
        | "Uploaded"
        | "Processing"
        | "NeedsReview"
        | "Reviewed"
        | "ReadyForExport"
        | "Exported"
        | "Archived"
        | "DraftGenerated"
      draft_status: "Draft" | "Finalized"
      draft_type: "Affidavit" | "AddressLetter" | "GapLetter"
      extraction_review_status:
        | "Unreviewed"
        | "PartiallyReviewed"
        | "Reviewed"
        | "Rejected"
      extraction_status:
        | "Pending"
        | "Processing"
        | "Extracted"
        | "NeedsReview"
        | "Reviewed"
        | "Failed"
      field_status:
        | "Extracted"
        | "NeedsReview"
        | "Accepted"
        | "Corrected"
        | "Rejected"
      finding_category:
        | "Name Mismatch"
        | "Address Mismatch"
        | "Date Mismatch"
        | "Age Calculation Issue"
        | "School Gap"
        | "Missing Information"
        | "Identity"
        | "Employment Mismatch"
        | "Income Discrepancy"
        | "Document Validity"
        | "Relationship Evidence"
      finding_field_role: "source_a" | "source_b" | "supporting"
      finding_severity: "High" | "Medium" | "Low" | "Warning"
      finding_status: "Open" | "Accepted" | "Resolved" | "Ignored"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      case_status: [
        "Draft",
        "Uploaded",
        "Processing",
        "NeedsReview",
        "Reviewed",
        "ReadyForExport",
        "Exported",
        "Archived",
        "DraftGenerated",
      ],
      draft_status: ["Draft", "Finalized"],
      draft_type: ["Affidavit", "AddressLetter", "GapLetter"],
      extraction_review_status: [
        "Unreviewed",
        "PartiallyReviewed",
        "Reviewed",
        "Rejected",
      ],
      extraction_status: [
        "Pending",
        "Processing",
        "Extracted",
        "NeedsReview",
        "Reviewed",
        "Failed",
      ],
      field_status: [
        "Extracted",
        "NeedsReview",
        "Accepted",
        "Corrected",
        "Rejected",
      ],
      finding_category: [
        "Name Mismatch",
        "Address Mismatch",
        "Date Mismatch",
        "Age Calculation Issue",
        "School Gap",
        "Missing Information",
        "Identity",
        "Employment Mismatch",
        "Income Discrepancy",
        "Document Validity",
        "Relationship Evidence",
      ],
      finding_field_role: ["source_a", "source_b", "supporting"],
      finding_severity: ["High", "Medium", "Low", "Warning"],
      finding_status: ["Open", "Accepted", "Resolved", "Ignored"],
    },
  },
} as const
