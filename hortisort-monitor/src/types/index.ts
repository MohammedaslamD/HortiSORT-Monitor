// =============================================================================
// HortiSort Monitor — TypeScript Type Definitions
// Interfaces for all 8 database tables + supporting union types.
// =============================================================================

// -----------------------------------------------------------------------------
// Union Types (literal unions for constrained columns)
// -----------------------------------------------------------------------------

/** Role assigned to a user account. */
export type UserRole = "customer" | "engineer" | "admin";

/** Operational status of a grading machine. */
export type MachineStatus = "running" | "idle" | "down" | "offline";

/** Severity level for a support ticket (P1 = most urgent). */
export type TicketSeverity =
  | "P1_critical"
  | "P2_high"
  | "P3_medium"
  | "P4_low";

/** Problem category for a support ticket. */
export type TicketCategory =
  | "hardware"
  | "software"
  | "sensor"
  | "electrical"
  | "other";

/** Lifecycle status of a support ticket. */
export type TicketStatus =
  | "open"
  | "in_progress"
  | "resolved"
  | "closed"
  | "reopened";

/** Machine running status recorded in a daily log entry. */
export type DailyLogStatus = "running" | "not_running" | "maintenance";

/** Reason for an engineer's on-site visit. */
export type VisitPurpose = "routine" | "ticket" | "installation" | "training";

/** Category of change recorded in machine history. */
export type ChangeType =
  | "location_change"
  | "status_change"
  | "engineer_change"
  | "software_update";

/** Entity types that can appear in the activity log. */
export type EntityType = "machine" | "ticket" | "user";

// -----------------------------------------------------------------------------
// Filter & Stats Interfaces (Phase 2)
// -----------------------------------------------------------------------------

/** Filters for the machine list page. All fields optional, AND-combined. */
export interface MachineFilters {
  status?: MachineStatus;
  model?: string;
  city?: string;
  search?: string;
}

/** Aggregated machine status counts for the dashboard. */
export interface MachineStats {
  total: number;
  running: number;
  idle: number;
  down: number;
  offline: number;
}

// -----------------------------------------------------------------------------
// Filter, Input & Resolution Interfaces (Phase 3)
// -----------------------------------------------------------------------------

/** Data required when resolving a ticket. */
export interface ResolutionData {
  root_cause: string
  solution: string
  parts_used?: string
}

/** Input data for creating a new ticket (service-layer input). */
export interface NewTicketData {
  machine_id: number
  raised_by: number
  severity: TicketSeverity
  category: TicketCategory
  title: string
  description: string
}

/** Filters for the daily logs list page. All fields optional, AND-combined. */
export interface DailyLogFilters {
  machineId?: number
  date?: string
  status?: DailyLogStatus
}

/** Filters for the site visits list page. All fields optional, AND-combined. */
export interface SiteVisitFilters {
  engineerId?: number
  machineId?: number
  purpose?: VisitPurpose
}

/** Input data for logging a new site visit. */
export interface NewSiteVisitData {
  machine_id: number
  engineer_id: number
  visit_date: string
  visit_purpose: VisitPurpose
  ticket_id?: number
  findings: string
  actions_taken: string
  parts_replaced?: string
  next_visit_due?: string
}

// -----------------------------------------------------------------------------
// Table: users
// -----------------------------------------------------------------------------

/** A user account — customer, field engineer, or admin. */
export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  whatsapp_number?: string;
  password_hash: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// -----------------------------------------------------------------------------
// Table: machines
// -----------------------------------------------------------------------------

/** A fruit/vegetable grading machine deployed at a customer site. */
export interface Machine {
  id: number;
  /** Unique human-readable code, e.g. "HS-2026-0042". */
  machine_code: string;
  machine_name: string;
  model: string;
  serial_number: string;
  /** FK → users.id (customer who owns this machine). */
  customer_id: number;
  /** FK → users.id (engineer responsible for this machine). */
  engineer_id: number;
  location: string;
  city: string;
  state: string;
  /** Defaults to "India". */
  country: string;
  /** Comma-separated capabilities, e.g. "size,color,weight". */
  grading_features: string;
  num_lanes: number;
  software_version: string;
  /** ISO date string of when the machine was installed. */
  installation_date: string;
  status: MachineStatus;
  /** ISO timestamp of the last status/data update. */
  last_updated: string;
  /** FK → users.id (user who last updated this record). */
  last_updated_by: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// -----------------------------------------------------------------------------
// Table: daily_logs
// -----------------------------------------------------------------------------

/** A single day's operational log for one machine. */
export interface DailyLog {
  id: number;
  /** FK → machines.id */
  machine_id: number;
  /** ISO date string (YYYY-MM-DD). */
  date: string;
  status: DailyLogStatus;
  /** Type of fruit/vegetable processed during this shift. */
  fruit_type: string;
  tons_processed: number;
  /** ISO time or datetime string for shift start. */
  shift_start: string;
  /** ISO time or datetime string for shift end. */
  shift_end: string;
  notes: string;
  /** FK → users.id (user who recorded this log). */
  updated_by: number;
  created_at: string;
  updated_at: string;
}

// -----------------------------------------------------------------------------
// Table: tickets
// -----------------------------------------------------------------------------

/** A support/maintenance ticket linked to a machine. */
export interface Ticket {
  id: number;
  /** Auto-generated ticket number, e.g. "TKT-00001". */
  ticket_number: string;
  /** FK → machines.id */
  machine_id: number;
  /** FK → users.id (user who raised the ticket). */
  raised_by: number;
  /** FK → users.id (engineer assigned to resolve). */
  assigned_to: number;
  severity: TicketSeverity;
  category: TicketCategory;
  title: string;
  description: string;
  status: TicketStatus;
  /** Target resolution time in hours based on severity SLA. */
  sla_hours: number;
  created_at: string;
  /** ISO timestamp when the ticket was resolved, or null if still open. */
  resolved_at: string | null;
  /** Total minutes taken to resolve, or null if unresolved. */
  resolution_time_mins: number | null;
  /** Root cause identified during resolution. */
  root_cause: string | null;
  /** Description of the fix applied. */
  solution: string | null;
  /** Parts consumed during the fix (free-text). */
  parts_used: string | null;
  /** Number of times this ticket has been reopened. */
  reopen_count: number;
  /** ISO timestamp of the most recent reopen, or null. */
  reopened_at: string | null;
  /** Customer satisfaction rating (1–5), or null if not yet rated. */
  customer_rating: number | null;
  /** Free-text feedback from the customer, or null. */
  customer_feedback: string | null;
  updated_at: string;
}

// -----------------------------------------------------------------------------
// Table: ticket_comments
// -----------------------------------------------------------------------------

/** A comment or update posted on a ticket by any user. */
export interface TicketComment {
  id: number;
  /** FK → tickets.id */
  ticket_id: number;
  /** FK → users.id */
  user_id: number;
  message: string;
  /** URL to an uploaded attachment, if any. */
  attachment_url?: string;
  created_at: string;
}

// -----------------------------------------------------------------------------
// Table: site_visits
// -----------------------------------------------------------------------------

/** Record of an engineer's physical visit to a machine site. */
export interface SiteVisit {
  id: number;
  /** FK → machines.id */
  machine_id: number;
  /** FK → users.id (visiting engineer). */
  engineer_id: number;
  /** ISO date string of the visit. */
  visit_date: string;
  visit_purpose: VisitPurpose;
  /** FK → tickets.id (if the visit is linked to a ticket). */
  ticket_id?: number;
  findings: string;
  actions_taken: string;
  /** Free-text list of parts replaced during the visit. */
  parts_replaced?: string;
  /** ISO date string for the recommended next visit. */
  next_visit_due?: string;
  created_at: string;
}

// -----------------------------------------------------------------------------
// Table: machine_history
// -----------------------------------------------------------------------------

/** An audit-trail entry recording a change to a machine's configuration. */
export interface MachineHistory {
  id: number;
  /** FK → machines.id */
  machine_id: number;
  change_type: ChangeType;
  old_value: string;
  new_value: string;
  /** FK → users.id (user who made the change). */
  changed_by: number;
  notes?: string;
  created_at: string;
}

// -----------------------------------------------------------------------------
// Table: activity_log
// -----------------------------------------------------------------------------

/** A general-purpose audit log entry for any user action on any entity. */
export interface ActivityLog {
  id: number;
  /** FK → users.id */
  user_id: number;
  /** Human-readable description of the action performed. */
  action: string;
  entity_type: EntityType;
  /** Primary key of the affected entity. */
  entity_id: number;
  /** Additional context or JSON payload describing the action. */
  details: string;
  created_at: string;
}
