import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';

import type { Machine, DailyLogStatus, MachineStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { getMachineById, updateMachineStatus } from '../services/machineService';
import { addDailyLog } from '../services/dailyLogService';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { TextArea } from '../components/common/TextArea';
import { Toast } from '../components/common/Toast';
import { getStatusBadgeColor } from '../utils/formatters';

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

/** Radio options for the DailyLogStatus field. */
const DAILY_LOG_STATUS_OPTIONS: { value: DailyLogStatus; label: string }[] = [
  { value: 'running', label: 'Running' },
  { value: 'not_running', label: 'Not Running' },
  { value: 'maintenance', label: 'Maintenance' },
];

/** Dropdown options for the fruit/vegetable type field. */
const FRUIT_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: 'Mango', label: 'Mango' },
  { value: 'Apple', label: 'Apple' },
  { value: 'Orange', label: 'Orange' },
  { value: 'Tomato', label: 'Tomato' },
  { value: 'Banana', label: 'Banana' },
  { value: 'Grapes', label: 'Grapes' },
  { value: 'Pomegranate', label: 'Pomegranate' },
  { value: 'Kiwi', label: 'Kiwi' },
  { value: 'Guava', label: 'Guava' },
  { value: 'Papaya', label: 'Papaya' },
  { value: 'Lemon', label: 'Lemon' },
  { value: 'Other', label: 'Other' },
];

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

/**
 * Form page that allows engineers and admins to update a machine's status
 * by creating a daily log entry. Accessed via `/machines/:id/update-status`.
 */
export function UpdateStatusPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Machine data
  const [machine, setMachine] = useState<Machine | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Form state
  const [status, setStatus] = useState<DailyLogStatus>('running');
  const [fruitType, setFruitType] = useState('');
  const [tonsProcessed, setTonsProcessed] = useState('');
  const [shiftStart, setShiftStart] = useState('');
  const [shiftEnd, setShiftEnd] = useState('');
  const [notes, setNotes] = useState('');

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // Validation errors (keyed by field name)
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ---------------------------------------------------------------------------
  // Fetch machine on mount
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const machineId = Number(id);
    if (Number.isNaN(machineId)) {
      setNotFound(true);
      setIsLoading(false);
      return;
    }

    getMachineById(machineId).then((found) => {
      if (!found) {
        setNotFound(true);
      } else {
        setMachine(found);
      }
      setIsLoading(false);
    });
  }, [id]);

  // ---------------------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------------------
  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    // Status is always set via radio (default "running"), no validation needed

    if (!fruitType) {
      newErrors.fruitType = 'Fruit type is required.';
    }

    const tons = parseFloat(tonsProcessed);
    if (tonsProcessed === '' || Number.isNaN(tons)) {
      newErrors.tonsProcessed = 'Tons processed is required.';
    } else if (tons < 0) {
      newErrors.tonsProcessed = 'Tons processed must be 0 or greater.';
    }

    if (!shiftStart) {
      newErrors.shiftStart = 'Shift start time is required.';
    }

    if (!shiftEnd) {
      newErrors.shiftEnd = 'Shift end time is required.';
    }

    if (shiftStart && shiftEnd && shiftEnd <= shiftStart) {
      newErrors.shiftEnd = 'Shift end must be after shift start.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // ---------------------------------------------------------------------------
  // Submit handler — creates a daily log and updates the machine status
  // ---------------------------------------------------------------------------
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!machine || !user) return;
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const today = new Date().toISOString().split('T')[0];

      // Create a daily log entry for today
      await addDailyLog({
        machine_id: machine.id,
        date: today,
        status,
        fruit_type: fruitType,
        tons_processed: parseFloat(tonsProcessed),
        shift_start: shiftStart,
        shift_end: shiftEnd,
        notes,
        updated_by: user.id,
      });

      // Map daily log status to machine status
      const machineStatusMap: Record<DailyLogStatus, MachineStatus> = {
        running: 'running',
        not_running: 'down',
        maintenance: 'idle',
      };
      await updateMachineStatus(machine.id, machineStatusMap[status], user.id);

      setShowToast(true);
      setTimeout(() => {
        navigate(`/machines/${machine.id}`);
      }, 1500);
    } catch (err) {
      // Show error in toast — reuse showToast by temporarily setting a message
      alert(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setIsSubmitting(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <svg
            className="animate-spin h-8 w-8 text-primary-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <p className="text-gray-500 text-sm">Loading machine data...</p>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Not found state
  // ---------------------------------------------------------------------------
  if (notFound || !machine) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="rounded-full bg-red-100 p-3">
          <svg
            className="h-8 w-8 text-red-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-gray-900">Machine not found</h2>
        <p className="text-sm text-gray-500">
          The machine you're looking for doesn't exist or you don't have access to it.
        </p>
        <Link
          to="/"
          className="text-sm font-medium text-primary-600 hover:text-primary-700 underline"
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Main form
  // ---------------------------------------------------------------------------
  return (
    <>
      {/* Success toast */}
      <Toast
        message="Status updated successfully"
        type="success"
        isVisible={showToast}
        onClose={() => setShowToast(false)}
        duration={3000}
      />

      <div className="max-w-lg mx-auto space-y-6">
        {/* Page title */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Update Status &mdash; {machine.machine_code}
          </h2>
        </div>

        {/* Machine info header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">{machine.machine_name}</p>
            <p className="text-xs text-gray-500 mt-0.5">{machine.machine_code}</p>
          </div>
          <Badge color={getStatusBadgeColor(machine.status)} size="sm">
            {machine.status.charAt(0).toUpperCase() + machine.status.slice(1)}
          </Badge>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 space-y-5" noValidate>
          {/* Status — Radio buttons */}
          <fieldset>
            <legend className="block text-sm font-medium text-gray-700 mb-2">
              Status <span className="text-red-500">*</span>
            </legend>
            <div className="flex flex-wrap gap-3">
              {DAILY_LOG_STATUS_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`
                    flex items-center gap-2 cursor-pointer rounded-lg border px-4 py-2.5
                    transition-colors duration-150
                    ${status === opt.value
                      ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500'
                      : 'border-gray-300 bg-white hover:bg-gray-50'
                    }
                  `.trim()}
                >
                  <input
                    type="radio"
                    name="status"
                    value={opt.value}
                    checked={status === opt.value}
                    onChange={() => setStatus(opt.value)}
                    className="text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700 font-medium">{opt.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {/* Fruit Type */}
          <Select
            label="Fruit Type"
            options={FRUIT_TYPE_OPTIONS}
            value={fruitType}
            onChange={(e) => setFruitType(e.target.value)}
            error={errors.fruitType}
            placeholder="Select a fruit type..."
            required
          />

          {/* Tons Processed */}
          <Input
            label="Tons Processed"
            type="number"
            min="0"
            step="0.1"
            placeholder="e.g. 5.5"
            value={tonsProcessed}
            onChange={(e) => setTonsProcessed(e.target.value)}
            error={errors.tonsProcessed}
            required
          />

          {/* Shift times */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Shift Start"
              type="time"
              value={shiftStart}
              onChange={(e) => setShiftStart(e.target.value)}
              error={errors.shiftStart}
              required
            />
            <Input
              label="Shift End"
              type="time"
              value={shiftEnd}
              onChange={(e) => setShiftEnd(e.target.value)}
              error={errors.shiftEnd}
              required
            />
          </div>

          {/* Notes */}
          <TextArea
            label="Notes"
            placeholder="Any observations, issues, or remarks..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />

          {/* Action buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              disabled={isSubmitting}
              className="flex-1"
            >
              Submit Update
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate(`/machines/${machine.id}`)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
