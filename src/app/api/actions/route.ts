import { auth } from '@clerk/nextjs/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { successResponse, errorResponse, handleApiError } from '@/lib/utils/api';

export type ActionType =
  | 'create_loan' | 'update_loan' | 'delete_loan'
  | 'create_borrower' | 'update_borrower' | 'delete_borrower'
  | 'create_covenant' | 'update_covenant' | 'delete_covenant'
  | 'create_covenant_test' | 'create_covenant_waiver'
  | 'acknowledge_alert' | 'dismiss_alert' | 'escalate_alert'
  | 'categorize_document' | 'archive_document' | 'trigger_extraction'
  | 'create_financial_period' | 'update_financial_period' | 'calculate_ratios'
  | 'bulk_update_loans' | 'bulk_acknowledge_alerts'
  | 'create_memo' | 'update_memo' | 'delete_memo';

interface ActionRequest {
  action: ActionType;
  params: Record<string, unknown>;
}

interface ActionResult {
  success: boolean;
  action: ActionType;
  message: string;
  data?: unknown;
  error?: string;
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return errorResponse('UNAUTHORIZED', 'Authentication required', 401);

    const supabase = createAdminClient();

    const { data: userData } = await supabase
      .from('users')
      .select('id, organization_id, role')
      .eq('clerk_id', userId)
      .is('deleted_at', null)
      .single();

    if (!userData?.organization_id) {
      return errorResponse('NOT_FOUND', 'User not found', 404);
    }

    const orgId = userData.organization_id;
    const dbUserId = userData.id;

    const body: ActionRequest = await request.json();
    const { action, params } = body;

    const result = await executeAction(supabase, orgId, dbUserId, action, params);

    // Audit log (fire and forget, don't block the response)
    try {
      await supabase.from('audit_logs').insert({
        organization_id: orgId,
        user_id: dbUserId,
        action: action,
        entity_type: getEntityType(action),
        entity_id: (result.data as { id?: string })?.id || null,
        changes: { params, success: result.success },
      });
    } catch {
      // Audit logging is non-critical
    }

    if (!result.success) {
      return errorResponse('ACTION_FAILED', result.error || 'Action failed', 400);
    }

    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}

function getEntityType(action: ActionType): string {
  if (action.includes('loan')) return 'loan';
  if (action.includes('borrower')) return 'borrower';
  if (action.includes('covenant')) return 'covenant';
  if (action.includes('alert')) return 'alert';
  if (action.includes('document')) return 'document';
  if (action.includes('financial')) return 'financial_period';
  if (action.includes('memo')) return 'memo';
  return 'system';
}

type SupabaseClient = ReturnType<typeof createAdminClient>;

async function executeAction(
  supabase: SupabaseClient,
  orgId: string,
  userId: string,
  action: ActionType,
  params: Record<string, unknown>
): Promise<ActionResult> {
  try {
    switch (action) {
      // ===== LOAN OPERATIONS =====
      case 'create_loan': {
        const { name, borrower_id, principal_amount, interest_rate, maturity_date, facility_type, status } = params;
        if (!name || !borrower_id) {
          return { success: false, action, message: '', error: 'Name and borrower_id required' };
        }
        const { data, error } = await supabase.from('loans').insert({
          organization_id: orgId,
          borrower_id: borrower_id as string,
          name: name as string,
          principal_amount: (principal_amount as number) || 0,
          interest_rate: (interest_rate as number) || 0,
          maturity_date: (maturity_date as string) || null,
          facility_type: (facility_type as string) || 'term_loan',
          status: (status as string) || 'active',
        }).select().single();
        if (error) throw error;
        return { success: true, action, message: `Loan "${name}" created`, data };
      }

      case 'update_loan': {
        const { loan_id, ...updates } = params;
        if (!loan_id) return { success: false, action, message: '', error: 'loan_id required' };
        const { data: loan } = await supabase.from('loans').select('id').eq('id', loan_id).eq('organization_id', orgId).single();
        if (!loan) return { success: false, action, message: '', error: 'Loan not found' };
        const { data, error } = await supabase.from('loans').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', loan_id).select().single();
        if (error) throw error;
        return { success: true, action, message: 'Loan updated', data };
      }

      case 'delete_loan': {
        const { loan_id } = params;
        if (!loan_id) return { success: false, action, message: '', error: 'loan_id required' };
        const { error } = await supabase.from('loans').update({ deleted_at: new Date().toISOString() }).eq('id', loan_id).eq('organization_id', orgId);
        if (error) throw error;
        return { success: true, action, message: 'Loan deleted', data: { id: loan_id } };
      }

      case 'bulk_update_loans': {
        const { loan_ids, updates } = params;
        if (!loan_ids || !Array.isArray(loan_ids)) return { success: false, action, message: '', error: 'loan_ids array required' };
        const { data, error } = await supabase.from('loans').update({ ...(updates as object), updated_at: new Date().toISOString() }).in('id', loan_ids as string[]).eq('organization_id', orgId).select();
        if (error) throw error;
        return { success: true, action, message: `${(data || []).length} loans updated`, data };
      }

      // ===== BORROWER OPERATIONS =====
      case 'create_borrower': {
        const { name, industry, rating, contact_email } = params;
        if (!name) return { success: false, action, message: '', error: 'Name required' };
        const { data, error } = await supabase.from('borrowers').insert({
          organization_id: orgId,
          name: name as string,
          industry: (industry as string) || null,
          rating: (rating as string) || null,
          contact_email: (contact_email as string) || null,
        }).select().single();
        if (error) throw error;
        return { success: true, action, message: `Borrower "${name}" created`, data };
      }

      case 'update_borrower': {
        const { borrower_id, ...updates } = params;
        if (!borrower_id) return { success: false, action, message: '', error: 'borrower_id required' };
        const { data, error } = await supabase.from('borrowers').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', borrower_id).eq('organization_id', orgId).select().single();
        if (error) throw error;
        return { success: true, action, message: 'Borrower updated', data };
      }

      case 'delete_borrower': {
        const { borrower_id } = params;
        if (!borrower_id) return { success: false, action, message: '', error: 'borrower_id required' };
        const { error } = await supabase.from('borrowers').update({ deleted_at: new Date().toISOString() }).eq('id', borrower_id).eq('organization_id', orgId);
        if (error) throw error;
        return { success: true, action, message: 'Borrower deleted', data: { id: borrower_id } };
      }

      // ===== COVENANT OPERATIONS =====
      case 'create_covenant': {
        const { loan_id, name, type, operator, threshold, testing_frequency } = params;
        if (!loan_id || !name || !type || threshold === undefined) {
          return { success: false, action, message: '', error: 'loan_id, name, type, threshold required' };
        }
        const { data: loan } = await supabase.from('loans').select('id').eq('id', loan_id).eq('organization_id', orgId).single();
        if (!loan) return { success: false, action, message: '', error: 'Loan not found' };
        const { data, error } = await supabase.from('covenants').insert({
          loan_id: loan_id as string,
          name: name as string,
          type: type as string,
          operator: (operator as string) || 'max',
          threshold: threshold as number,
          testing_frequency: (testing_frequency as string) || 'quarterly',
        }).select().single();
        if (error) throw error;
        return { success: true, action, message: `Covenant "${name}" created`, data };
      }

      case 'update_covenant': {
        const { covenant_id, ...updates } = params;
        if (!covenant_id) return { success: false, action, message: '', error: 'covenant_id required' };
        const { data, error } = await supabase.from('covenants').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', covenant_id).select().single();
        if (error) throw error;
        return { success: true, action, message: 'Covenant updated', data };
      }

      case 'delete_covenant': {
        const { covenant_id } = params;
        if (!covenant_id) return { success: false, action, message: '', error: 'covenant_id required' };
        const { error } = await supabase.from('covenants').update({ deleted_at: new Date().toISOString() }).eq('id', covenant_id);
        if (error) throw error;
        return { success: true, action, message: 'Covenant deleted', data: { id: covenant_id } };
      }

      case 'create_covenant_test': {
        const { covenant_id, calculated_value, period_end_date, notes } = params;
        if (!covenant_id || calculated_value === undefined) {
          return { success: false, action, message: '', error: 'covenant_id and calculated_value required' };
        }
        const { data: covenant } = await supabase.from('covenants').select('threshold, operator').eq('id', covenant_id).single();
        if (!covenant) return { success: false, action, message: '', error: 'Covenant not found' };

        const value = calculated_value as number;
        const threshold = covenant.threshold;
        const operator = covenant.operator;
        let status = 'compliant';
        let headroom = 0;

        if (operator === 'max') {
          headroom = ((threshold - value) / threshold) * 100;
          if (value > threshold) status = 'breach';
          else if (headroom < 15) status = 'warning';
        } else {
          headroom = ((value - threshold) / threshold) * 100;
          if (value < threshold) status = 'breach';
          else if (headroom < 15) status = 'warning';
        }

        const { data, error } = await supabase.from('covenant_tests').insert({
          covenant_id: covenant_id as string,
          calculated_value: value,
          threshold_at_test: threshold,
          status,
          headroom_percentage: headroom,
          period_end_date: (period_end_date as string) || new Date().toISOString().split('T')[0],
          tested_at: new Date().toISOString(),
          notes: (notes as string) || null,
        }).select().single();
        if (error) throw error;
        return { success: true, action, message: `Test recorded: ${status} (${headroom.toFixed(1)}% headroom)`, data };
      }

      case 'create_covenant_waiver': {
        const { covenant_id, waiver_reason, waiver_end_date } = params;
        if (!covenant_id || !waiver_reason) {
          return { success: false, action, message: '', error: 'covenant_id and waiver_reason required' };
        }
        const { data, error } = await supabase.from('covenants').update({
          waiver_active: true,
          waiver_reason: waiver_reason as string,
          waiver_end_date: (waiver_end_date as string) || null,
          updated_at: new Date().toISOString(),
        }).eq('id', covenant_id).select().single();
        if (error) throw error;
        return { success: true, action, message: 'Covenant waiver created', data };
      }

      // ===== ALERT OPERATIONS =====
      case 'acknowledge_alert': {
        const { alert_id, notes } = params;
        if (!alert_id) return { success: false, action, message: '', error: 'alert_id required' };
        const { data, error } = await supabase.from('alerts').update({
          status: 'acknowledged',
          acknowledged_at: new Date().toISOString(),
          acknowledged_by: userId,
          notes: (notes as string) || null,
        }).eq('id', alert_id).eq('organization_id', orgId).select().single();
        if (error) throw error;
        return { success: true, action, message: 'Alert acknowledged', data };
      }

      case 'dismiss_alert': {
        const { alert_id, reason } = params;
        if (!alert_id) return { success: false, action, message: '', error: 'alert_id required' };
        const { data, error } = await supabase.from('alerts').update({
          status: 'dismissed',
          dismissed_at: new Date().toISOString(),
          dismissed_reason: (reason as string) || null,
        }).eq('id', alert_id).eq('organization_id', orgId).select().single();
        if (error) throw error;
        return { success: true, action, message: 'Alert dismissed', data };
      }

      case 'escalate_alert': {
        const { alert_id, escalation_reason } = params;
        if (!alert_id) return { success: false, action, message: '', error: 'alert_id required' };
        const { data, error } = await supabase.from('alerts').update({
          severity: 'critical',
          escalated: true,
          escalation_reason: (escalation_reason as string) || null,
          escalated_at: new Date().toISOString(),
        }).eq('id', alert_id).eq('organization_id', orgId).select().single();
        if (error) throw error;
        return { success: true, action, message: 'Alert escalated to critical', data };
      }

      case 'bulk_acknowledge_alerts': {
        const { alert_ids, notes } = params;
        if (!alert_ids || !Array.isArray(alert_ids)) return { success: false, action, message: '', error: 'alert_ids array required' };
        const { data, error } = await supabase.from('alerts').update({
          status: 'acknowledged',
          acknowledged_at: new Date().toISOString(),
          acknowledged_by: userId,
          notes: (notes as string) || 'Bulk acknowledged by Monty',
        }).in('id', alert_ids as string[]).eq('organization_id', orgId).select();
        if (error) throw error;
        return { success: true, action, message: `${(data || []).length} alerts acknowledged`, data };
      }

      // ===== DOCUMENT OPERATIONS =====
      case 'categorize_document': {
        const { document_id, category } = params;
        if (!document_id || !category) return { success: false, action, message: '', error: 'document_id and category required' };
        const { data, error } = await supabase.from('documents').update({
          category: category as string,
          updated_at: new Date().toISOString(),
        }).eq('id', document_id).eq('organization_id', orgId).select().single();
        if (error) throw error;
        return { success: true, action, message: `Document categorized as "${category}"`, data };
      }

      case 'archive_document': {
        const { document_id, reason } = params;
        if (!document_id) return { success: false, action, message: '', error: 'document_id required' };
        const { data, error } = await supabase.from('documents').update({
          archived: true,
          archived_at: new Date().toISOString(),
          archive_reason: (reason as string) || null,
        }).eq('id', document_id).eq('organization_id', orgId).select().single();
        if (error) throw error;
        return { success: true, action, message: 'Document archived', data };
      }

      case 'trigger_extraction': {
        const { document_id } = params;
        if (!document_id) return { success: false, action, message: '', error: 'document_id required' };
        const { data, error } = await supabase.from('documents').update({
          extraction_status: 'pending',
          updated_at: new Date().toISOString(),
        }).eq('id', document_id).eq('organization_id', orgId).select().single();
        if (error) throw error;
        return { success: true, action, message: 'Extraction triggered', data };
      }

      // ===== FINANCIAL OPERATIONS =====
      case 'create_financial_period': {
        const { loan_id, period_end_date, revenue, ebitda, total_debt, cash, net_income, interest_expense } = params;
        if (!loan_id || !period_end_date) {
          return { success: false, action, message: '', error: 'loan_id and period_end_date required' };
        }
        const { data, error } = await supabase.from('financial_periods').insert({
          loan_id: loan_id as string,
          period_end_date: period_end_date as string,
          revenue: (revenue as number) || null,
          ebitda: (ebitda as number) || null,
          total_debt: (total_debt as number) || null,
          cash: (cash as number) || null,
          net_income: (net_income as number) || null,
          interest_expense: (interest_expense as number) || null,
        }).select().single();
        if (error) throw error;
        return { success: true, action, message: `Financial period for ${period_end_date} created`, data };
      }

      case 'update_financial_period': {
        const { period_id, ...updates } = params;
        if (!period_id) return { success: false, action, message: '', error: 'period_id required' };
        const { data, error } = await supabase.from('financial_periods').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', period_id).select().single();
        if (error) throw error;
        return { success: true, action, message: 'Financial period updated', data };
      }

      case 'calculate_ratios': {
        const { loan_id } = params;
        if (!loan_id) return { success: false, action, message: '', error: 'loan_id required' };
        const { data: period } = await supabase.from('financial_periods').select('*').eq('loan_id', loan_id).order('period_end_date', { ascending: false }).limit(1).single();
        if (!period) return { success: false, action, message: '', error: 'No financial data found' };

        const ratios = {
          leverage_ratio: period.total_debt && period.ebitda ? Number((period.total_debt / period.ebitda).toFixed(2)) : null,
          interest_coverage: period.ebitda && period.interest_expense ? Number((period.ebitda / period.interest_expense).toFixed(2)) : null,
        };
        return { success: true, action, message: 'Ratios calculated', data: { period_id: period.id, ratios } };
      }

      // ===== MEMO OPERATIONS =====
      case 'create_memo': {
        const { loan_id, title, content, generated_by_ai } = params;
        if (!loan_id || !title || !content) {
          return { success: false, action, message: '', error: 'loan_id, title, and content required' };
        }
        // Verify loan belongs to org
        const { data: loan } = await supabase.from('loans').select('id, name, borrowers (name)').eq('id', loan_id).eq('organization_id', orgId).single();
        if (!loan) return { success: false, action, message: '', error: 'Loan not found' };

        const { data, error } = await supabase.from('memos').insert({
          organization_id: orgId,
          loan_id: loan_id as string,
          title: title as string,
          content: content as string,
          generated_by_ai: (generated_by_ai as boolean) ?? true,
          created_by: userId,
        }).select().single();
        if (error) throw error;

        // Log to audit_logs
        await supabase.from('audit_logs').insert({
          organization_id: orgId,
          user_id: userId,
          action: 'create',
          entity_type: 'memo',
          entity_id: data.id,
          changes: { title, loan_id },
        });

        return { success: true, action, message: `Memo "${title}" created for ${(loan as { borrowers?: { name?: string } }).borrowers?.name || 'Unknown'}`, data };
      }

      case 'update_memo': {
        const { memo_id, ...updates } = params;
        if (!memo_id) return { success: false, action, message: '', error: 'memo_id required' };
        const { data, error } = await supabase.from('memos').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', memo_id).eq('organization_id', orgId).select().single();
        if (error) throw error;

        // Log to audit_logs
        await supabase.from('audit_logs').insert({
          organization_id: orgId,
          user_id: userId,
          action: 'update',
          entity_type: 'memo',
          entity_id: memo_id as string,
          changes: updates,
        });

        return { success: true, action, message: 'Memo updated', data };
      }

      case 'delete_memo': {
        const { memo_id } = params;
        if (!memo_id) return { success: false, action, message: '', error: 'memo_id required' };
        const { error } = await supabase.from('memos').update({ deleted_at: new Date().toISOString() }).eq('id', memo_id).eq('organization_id', orgId);
        if (error) throw error;

        // Log to audit_logs
        await supabase.from('audit_logs').insert({
          organization_id: orgId,
          user_id: userId,
          action: 'delete',
          entity_type: 'memo',
          entity_id: memo_id as string,
        });

        return { success: true, action, message: 'Memo deleted', data: { id: memo_id } };
      }

      default:
        return { success: false, action, message: '', error: `Unknown action: ${action}` };
    }
  } catch (error) {
    return { success: false, action, message: '', error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
