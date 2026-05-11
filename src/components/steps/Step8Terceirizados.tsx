import { Briefcase } from 'lucide-react'
import { DynamicItemList, type CostItem } from '@/components/form/DynamicItemList'

interface Step8Props {
  items: CostItem[]
  onChange: (items: CostItem[]) => void
}

export function Step8Terceirizados({ items, onChange }: Step8Props) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 pb-2 border-b border-gray-100">
        <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
          <Briefcase className="w-5 h-5 text-teal-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Serviços Terceirizados</h2>
          <p className="text-sm text-gray-500">
            Custos com <strong>empresas prestadoras de serviço</strong>. Ex: empresa de limpeza,
            segurança, manutenção, jardinagem.
          </p>
        </div>
      </div>

      {/* Aviso de escopo */}
      <div className="flex items-start gap-2 bg-teal-50 border border-teal-200 rounded-xl px-4 py-3 text-sm text-teal-800">
        <span className="text-base leading-none mt-0.5 shrink-0">ℹ️</span>
        <p>
          Esta seção é exclusiva para <strong>contratos com empresas</strong>. Funcionários
          terceirizados (pessoa física) devem ser cadastrados na etapa de{' '}
          <strong>Funcionários</strong> com o vínculo "Terceirizado".
        </p>
      </div>

      <DynamicItemList
        title="Serviços de Empresas"
        description="Adicione cada contrato ou serviço prestado por empresa terceirizada"
        items={items}
        onChange={onChange}
        namePlaceholder="Ex: Empresa de Limpeza, Segurança, Manutenção..."
        colorClass="bg-teal-50 border-teal-100"
      />
    </div>
  )
}
