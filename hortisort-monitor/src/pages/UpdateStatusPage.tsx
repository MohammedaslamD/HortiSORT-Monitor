import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMachineById, updateMachineStatus } from '../services/machineService';
import { addDailyLog } from '../services/dailyLogService';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { TextArea } from '../components/common/TextArea';
import { Toast } from '../components/common/Toast';
import type { Machine, MachineStatus, DailyLogStatus } from '../types';

const MACHINE_STATUS_OPTIONS: { value: MachineStatus; label: string }[] = [
  { value: 'running', label: 'Running' },
  { value: 'idle', label: 'Idle' },
  { value: 'down', label: 'Down' },
  { value: 'offline', label: 'Offline' },
];

const FRUIT_TYPE_OPTIONS = [
  { value: '', label: 'Select fruit/vegetable…' },
  { value: 'Mango', label: 'Mango' },
  { value: 'Grapes', label: 'Grapes' },
  { value: 'Tomato', label: 'Tomato' },
  { value: 'Banana', label: 'Banana' },
  { value: 'Pomegranate', label: 'Pomegranate' },
  { value: 'Apple', label: 'Apple' },
  { value: 'Guava', label: 'Guava' },
  { value: 'Orange', label: 'Orange' },
  { value: 'Other', label: 'Other' },
];

/** Maps machine status to the closest daily log status. */
function toDailyLogStatus(status: MachineStatus): DailyLogStatus {
  if (status === 'running') return 'running';
  if (status === 'down') return 'not_running';
  return 'maintenance';
}

/** Today's date in YYYY-MM-DD format. */
function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Form page for engineers and admins to update a machine's operational status
 * and submit a daily production log entry.
 */
export function UpdateStatusPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [machine, setMachine] = useState<Machine | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);

  // Form state
  const [machineStatus, setMachineStatus] = useState<MachineStatus>('running');
  const [fruitType, setFruitType] = useState('');
  const [tonsProcessed, setTonsProcessed] = useState('');
  const [shiftStart, setShiftStart] = useState('06:00');
  const [shiftEnd, setShiftEnd] = useState('14:00');
  const [notes, setNotes] = useState('');

  // Form validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

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
        // Pre-select current status
        setMachineStatus(found.status);
      }
      setIsLoading(false);
    });
  }, [id]);

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!fruitType && machineStatus === 'running') {
      newErrors.fruitType = 'Fruit type is required when machine is running.';
    }
    const tons = parseFloat(tonsProcessed);
    if (machineStatus === 'running') {
      if (tonsProcessed === '' || Number.isNaN(tons) || tons < 0) {
        newErrors.tonsProcessed = 'Enter a valid number of tons (≥ 0).';
      }
    }
    if (!shiftStart) newErrors.shiftStart = 'Shift start time is required.';
    if (!shiftEnd) newErrors.shiftEnd = 'Shift end time is required.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!machine || !user) return;
    if (!validate()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Update machine status in mock data
      await updateMachineStatus(machine.id, machineStatus, user.id);

      // Add daily log entry
      await addDailyLog({
        machine_id: machine.id,
        date: todayStr(),
        status: toDailyLogStatus(machineStatus),
        fruit_type: fruitType,
        tons_processed: machineStatus === 'running' ? parseFloat(tonsProcessed) || 0 : 0,
        shift_start: shiftStart,
        shift_end: shiftEnd,
        notes,
        updated_by: user.id,
      });

      setShowToast(true);
      // Redirect after a short delay so toast is visible
      setTimeout(() => {
        navigate(`/machines/${machine.id}`);
      }, 1500);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to update status.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-500 text-sm">Loading...</p>
      </div>
    );
  }

  if (notFound || !machine) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-gray-700 font-medium">Machine not found.</p>
        <Button variant="secondary" size="sm" onClick={() => navigate('/machines')}>
          Back to Machines
        </Button>
      </div>
    );
  }

  return (
    <>
      {/* Success toast */}
      <Toast
        message="Status updated successfully!"
        type="success"
        isVisible={showToast}
        onClose={() => setShowToast(false)}
        duration={3000}
      />

      <div className="max-w-lg mx-auto space-y-6">
        {/* Back link */}
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          ← Back
        </button>

        {/* Page header */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Update Status</h2>
          <p className="text-sm text-gray-500 mt-1">
            {machine.machine_code} &bull; {machine.machine_name}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 space-y-5" noValidate>
          {/* Machine Status */}
          <fieldset>
            <legend className="block text-sm font-medium text-gray-700 mb-2">Machine Status</legend>
            <div className="flex flex-wrap gap-3">
              {MACHINE_STATUS_OPTIONS.map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="machineStatus"
                    value={opt.value}
                    checked={machineStatus === opt.value}
                    onChange={() => setMachineStatus(opt.value)}
                    className="text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">{opt.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {/* Fruit Type */}
          <Select
            label="Fruit / Vegetable Type"
            options={FRUIT_TYPE_OPTIONS}
            value={fruitType}
            onChange={(e) => setFruitType(e.target.value)}
            error={errors.fruitType}
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
            disabled={machineStatus !== 'running'}
          />

          {/* Shift times */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Shift Start"
              type="time"
              value={shiftStart}
              onChange={(e) => setShiftStart(e.target.value)}
              error={errors.shiftStart}
            />
            <Input
              label="Shift End"
              type="time"
              value={shiftEnd}
              onChange={(e) => setShiftEnd(e.target.value)}
              error={errors.shiftEnd}
            />
          </div>

          {/* Notes */}
          <TextArea
            label="Notes"
            placeholder="Any observations, issues, or remarks…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />

          {/* Submit error */}
          {submitError && (
            <div className="rounded-md bg-red-50 p-3">
              <p className="text-sm text-red-700">{submitError}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              className="flex-1"
            >
              Submit Update
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate(-1)}
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
