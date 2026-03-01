import { useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getProject, createProject, updateProject } from '../api/projects.js'
import { PROJECT_MANAGERS, HANDING_OVER_STATUS } from '../utils/constants.js'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import ErrorMessage from '../components/ErrorMessage.jsx'

const SECTION = ({ title, children }) => (
  <fieldset className="border border-gray-200 rounded-lg p-5">
    <legend className="px-2 text-sm font-semibold text-blue-800">{title}</legend>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">{children}</div>
  </fieldset>
)

const FLD = ({ label, error, children }) => (
  <div>
    <label className="label">{label}</label>
    {children}
    {error && <p className="text-xs text-red-600 mt-1">{error.message}</p>}
  </div>
)

export default function ProjectForm() {
  const { pk } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const isEdit = !!pk

  const { data: existing, isLoading } = useQuery({
    queryKey: ['project', pk],
    queryFn: () => getProject(pk),
    enabled: isEdit,
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm()

  useEffect(() => {
    if (existing) reset(existing)
  }, [existing, reset])

  const createMutation = useMutation({
    mutationFn: createProject,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['projects'] })
      navigate(`/projects/${data.id}`)
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data) => updateProject(pk, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project', pk] })
      qc.invalidateQueries({ queryKey: ['projects'] })
      navigate(`/projects/${pk}`)
    },
  })

  const onSubmit = (data) => {
    // Clean empty strings to null for optional fields
    const cleaned = Object.fromEntries(
      Object.entries(data).map(([k, v]) => [k, v === '' ? null : v])
    )
    if (isEdit) {
      updateMutation.mutate(cleaned)
    } else {
      createMutation.mutate(cleaned)
    }
  }

  const serverError = createMutation.error || updateMutation.error

  if (isLoading) return <LoadingSpinner size="lg" className="mt-20" />

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
        <Link to="/projects" className="hover:text-blue-700">Projects</Link>
        <span>/</span>
        <span>{isEdit ? `Edit ${existing?.Project_number}` : 'New Project'}</span>
      </div>
      <h1 className="text-2xl font-bold text-gray-900">
        {isEdit ? 'Edit Project' : 'New Project'}
      </h1>

      {serverError && (
        <ErrorMessage
          message={
            serverError.response?.data
              ? JSON.stringify(serverError.response.data)
              : serverError.message
          }
        />
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <SECTION title="Basic Information">
          <FLD label="Project Number *" error={errors.Project_number}>
            <input
              className="input"
              {...register('Project_number', {
                required: 'Project number is required',
                pattern: { value: /^\d{4}-\d{2,}$/, message: 'Format: YYYY-XX (e.g., 2024-01)' },
              })}
              placeholder="2024-01"
            />
          </FLD>
          <FLD label="Project Name" error={errors.Project_name}>
            <input className="input" {...register('Project_name')} />
          </FLD>
          <FLD label="Client" error={errors.Client}>
            <input className="input" {...register('Client')} />
          </FLD>
          <FLD label="Project Manager" error={errors.Project_Manager}>
            <select className="input" {...register('Project_Manager')}>
              <option value="">Select PM</option>
              {PROJECT_MANAGERS.map((pm) => (
                <option key={pm} value={pm}>{pm}</option>
              ))}
            </select>
          </FLD>
          <FLD label="Contract Number" error={errors.Contract_Number}>
            <input className="input" {...register('Contract_Number')} />
          </FLD>
          <FLD label="Year" error={errors.Year}>
            <input type="number" className="input" {...register('Year')} placeholder={new Date().getFullYear()} />
          </FLD>
        </SECTION>

        {/* Financial */}
        <SECTION title="Financial">
          <FLD label="Contract Value (AED)" error={errors.Contract_Value}>
            <input type="number" step="0.01" className="input" {...register('Contract_Value')} />
          </FLD>
          <FLD label="Main Contract Value (AED)" error={errors.Main_Contract_Value}>
            <input type="number" step="0.01" className="input" {...register('Main_Contract_Value')} />
          </FLD>
          {[1, 2, 3, 4, 5, 6, 7].map((n) => (
            <FLD key={n} label={`Variation ${n} (AED)`}>
              <input type="number" step="0.01" className="input" {...register(`Variation_${n}`)} />
            </FLD>
          ))}
          <FLD label="Project Value (AED)" error={errors.Project_Value}>
            <input type="number" step="0.01" className="input" {...register('Project_Value')} />
          </FLD>
        </SECTION>

        {/* Progress */}
        <SECTION title="Progress">
          <FLD label="Physical Completion (0-1)" error={errors.Physical_Completion}>
            <input type="number" step="0.001" min="0" max="1" className="input" {...register('Physical_Completion')} />
          </FLD>
          <FLD label="Financial Completion (0-1)" error={errors.Financial_Completion}>
            <input type="number" step="0.001" min="0" max="1" className="input" {...register('Financial_Completion')} />
          </FLD>
          <FLD label="Project Finished" error={errors.Project_Finished}>
            <select className="input" {...register('Project_Finished')}>
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
          </FLD>
          <FLD label="Remaining 10%" error={errors.Remaining_10_Percent}>
            <select className="input" {...register('Remaining_10_Percent')}>
              <option value="">N/A</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </FLD>
        </SECTION>

        {/* Dates */}
        <SECTION title="Dates">
          <FLD label="Start Date" error={errors.Start_Date}>
            <input type="date" className="input" {...register('Start_Date')} />
          </FLD>
          <FLD label="End Date (Planned)" error={errors.End_Date}>
            <input type="date" className="input" {...register('End_Date')} />
          </FLD>
          <FLD label="Actual End Date" error={errors.Actual_End_Date}>
            <input type="date" className="input" {...register('Actual_End_Date')} />
          </FLD>
        </SECTION>

        {/* Handing Over */}
        <SECTION title="Initial Handing Over">
          <FLD label="Letter No.">
            <input className="input" {...register('Initial_Handing_Over_Letter_No')} />
          </FLD>
          <FLD label="Letter Date">
            <input type="date" className="input" {...register('Initial_Handing_Over_Letter_Date')} />
          </FLD>
          <FLD label="Status">
            <select className="input" {...register('Initial_Handing_Over_Status')}>
              <option value="">Select</option>
              {HANDING_OVER_STATUS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </FLD>
          <div className="sm:col-span-2 lg:col-span-3">
            <FLD label="Comments">
              <textarea rows={2} className="input" {...register('Initial_Handing_Over_Comments')} />
            </FLD>
          </div>
        </SECTION>

        <SECTION title="Final Handing Over">
          <FLD label="Letter No.">
            <input className="input" {...register('Final_Handing_Over_Letter_No')} />
          </FLD>
          <FLD label="Letter Date">
            <input type="date" className="input" {...register('Final_Handing_Over_Letter_Date')} />
          </FLD>
          <FLD label="Status">
            <select className="input" {...register('Final_Handing_Over_Status')}>
              <option value="">Select</option>
              {HANDING_OVER_STATUS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </FLD>
          <div className="sm:col-span-2 lg:col-span-3">
            <FLD label="Comments">
              <textarea rows={2} className="input" {...register('Final_Handing_Over_Comments')} />
            </FLD>
          </div>
        </SECTION>

        {/* Notes */}
        <div className="card">
          <label className="label">Notes</label>
          <textarea rows={3} className="input" {...register('Notes')} />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pb-4">
          <Link to={isEdit ? `/projects/${pk}` : '/projects'} className="btn btn-secondary">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}
            className="btn btn-primary disabled:opacity-60"
          >
            {isEdit ? 'Save Changes' : 'Create Project'}
          </button>
        </div>
      </form>
    </div>
  )
}
