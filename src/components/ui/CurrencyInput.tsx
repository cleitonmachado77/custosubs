import { cn } from '@/lib/utils'
import { formatCurrencyInput } from '@/lib/utils'
import type { InputHTMLAttributes } from 'react'
import { forwardRef, useState } from 'react'

interface CurrencyInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  label?: string
  error?: string
  value: number
  onChange: (value: number) => void
}

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ label, error, value, onChange, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    const [displayValue, setDisplayValue] = useState(() =>
      value > 0 ? formatCurrencyInput(String(Math.round(value * 100))) : ''
    )

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
      const raw = e.target.value.replace(/\D/g, '')
      const formatted = formatCurrencyInput(raw)
      setDisplayValue(formatted)
      const numeric = raw ? parseInt(raw, 10) / 100 : 0
      onChange(numeric)
    }

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 pointer-events-none">
            R$
          </span>
          <input
            ref={ref}
            id={inputId}
            type="text"
            inputMode="numeric"
            value={displayValue}
            onChange={handleChange}
            className={cn(
              'w-full pl-9 pr-3 py-2 text-sm border rounded-lg bg-white text-gray-900 placeholder-gray-400',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
              'transition-colors duration-150',
              error ? 'border-red-400 bg-red-50' : 'border-gray-300',
              className
            )}
            placeholder="0,00"
            {...props}
          />
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    )
  }
)

CurrencyInput.displayName = 'CurrencyInput'
