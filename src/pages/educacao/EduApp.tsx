import { useState } from 'react'
import { EduSidebar, type EduScreen } from '@/components/layout/EduSidebar'
import { EduDashboard } from './EduDashboard'
import { EduHomeMunicipios } from './EduHomeMunicipios'
import { EduMunicipioDetalhe } from './EduMunicipioDetalhe'
import { EduPainelLancamento } from './EduPainelLancamento'
import type { Municipio } from '@/types'
import type { Escola } from '@/types/educacao'

type EduView =
  | { screen: 'edu-home' }
  | { screen: 'edu-municipio'; municipio: Municipio }
  | { screen: 'edu-lancamento'; municipio: Municipio; escola: Escola; mes: number; ano: number }
  | { screen: 'edu-dashboard' }
  | { screen: 'edu-importar' }

interface EduAppProps {
  onBackToLanding: () => void
}

export function EduApp({ onBackToLanding }: EduAppProps) {
  const [view, setView] = useState<EduView>({ screen: 'edu-dashboard' })

  function handleNavigate(screen: 'edu-home' | 'edu-dashboard' | 'edu-importar') {
    setView({ screen })
  }

  return (
    <div className="edu-layout">
      <EduSidebar
        activeScreen={view.screen as EduScreen}
        onNavigate={handleNavigate}
        onBackToLanding={onBackToLanding}
      />

      <main className="edu-main">
        {view.screen === 'edu-home' && (
          <EduHomeMunicipios
            onSelectMunicipio={(municipio) => setView({ screen: 'edu-municipio', municipio })}
            onOpenDashboard={() => setView({ screen: 'edu-dashboard' })}
          />
        )}

        {view.screen === 'edu-municipio' && (
          <EduMunicipioDetalhe
            municipio={view.municipio}
            onBack={() => setView({ screen: 'edu-home' })}
            onLancar={(escola, mes, ano) =>
              setView({ screen: 'edu-lancamento', municipio: view.municipio, escola, mes, ano })
            }
          />
        )}

        {view.screen === 'edu-lancamento' && (
          <EduPainelLancamento
            municipio={view.municipio}
            escola={view.escola}
            mes={view.mes}
            ano={view.ano}
            onBack={() => setView({ screen: 'edu-municipio', municipio: view.municipio })}
          />
        )}

        {view.screen === 'edu-dashboard' && (
          <EduDashboard onBack={() => setView({ screen: 'edu-home' })} />
        )}

        {view.screen === 'edu-importar' && (
          <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-6">
            <div className="text-center py-16 text-gray-400">
              <p className="text-sm">Importação de Excel — Em desenvolvimento</p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
