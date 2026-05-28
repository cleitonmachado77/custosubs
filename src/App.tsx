import './App.css'
import { useState } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { ChatIA } from '@/components/ia/ChatIA'
import { LandingPage } from '@/pages/LandingPage'
import { HomeMunicipios } from '@/pages/HomeMunicipios'
import { MunicipioDetalhe } from '@/pages/MunicipioDetalhe'
import { SecretariaDetalhe } from '@/pages/SecretariaDetalhe'
import { PainelLancamento } from '@/pages/PainelLancamento'
import { Dashboard } from '@/pages/Dashboard'
import { ImportarExcel } from '@/pages/ImportarExcel'
import { EduApp } from '@/pages/educacao/EduApp'
import type { Municipio, OutraUnidadeSaude, SecretariaSaude, UBS } from '@/types'

type View =
  | { screen: 'landing' }
  | { screen: 'home' }
  | { screen: 'municipio'; municipio: Municipio }
  | { screen: 'secretaria'; municipio: Municipio; secretaria: SecretariaSaude }
  | { screen: 'lancamento'; municipio: Municipio; ubs: UBS; mes: number; ano: number }
  | { screen: 'lancamento-secretaria'; municipio: Municipio; secretaria: SecretariaSaude; mes: number; ano: number }
  | { screen: 'lancamento-outra-unidade'; municipio: Municipio; outraUnidade: OutraUnidadeSaude; mes: number; ano: number }
  | { screen: 'dashboard' }
  | { screen: 'importar' }
  | { screen: 'educacao' }

export default function App() {
  const [view, setView] = useState<View>({ screen: 'landing' })

  function handleNavigate(screen: 'home' | 'dashboard' | 'importar') {
    setView({ screen })
  }

  // Tela de entrada — sem sidebar
  if (view.screen === 'landing') {
    return (
      <LandingPage
        onEnterModule={(module) => {
          if (module === 'saude') setView({ screen: 'dashboard' })
          else if (module === 'educacao') setView({ screen: 'educacao' })
        }}
      />
    )
  }

  // Módulo Educação — layout próprio
  if (view.screen === 'educacao') {
    return (
      <EduApp onBackToLanding={() => setView({ screen: 'landing' })} />
    )
  }

  return (
    <div className="app-layout">
      <Sidebar
        activeScreen={view.screen}
        onNavigate={handleNavigate}
        onBackToLanding={() => setView({ screen: 'landing' })}
      />

      <main className="app-main">
        {view.screen === 'home' && (
          <HomeMunicipios
            onSelectMunicipio={(municipio) => setView({ screen: 'municipio', municipio })}
            onOpenDashboard={() => setView({ screen: 'dashboard' })}
          />
        )}

        {view.screen === 'municipio' && (
          <MunicipioDetalhe
            municipio={view.municipio}
            onBack={() => setView({ screen: 'home' })}
            onLancar={(ubs, mes, ano) =>
              setView({ screen: 'lancamento', municipio: view.municipio, ubs, mes, ano })
            }
            onSelectSecretaria={(secretaria) =>
              setView({ screen: 'secretaria', municipio: view.municipio, secretaria })
            }
            onLancarOutraUnidade={(outraUnidade, mes, ano) =>
              setView({ screen: 'lancamento-outra-unidade', municipio: view.municipio, outraUnidade, mes, ano })
            }
          />
        )}

        {view.screen === 'secretaria' && (
          <SecretariaDetalhe
            municipio={view.municipio}
            secretaria={view.secretaria}
            onBack={() => setView({ screen: 'municipio', municipio: view.municipio })}
            onLancar={(ubs, mes, ano) =>
              setView({ screen: 'lancamento', municipio: view.municipio, ubs, mes, ano })
            }
            onLancarSecretaria={(secretaria, mes, ano) =>
              setView({ screen: 'lancamento-secretaria', municipio: view.municipio, secretaria, mes, ano })
            }
          />
        )}

        {view.screen === 'lancamento' && (
          <PainelLancamento
            municipio={view.municipio}
            ubs={view.ubs}
            mes={view.mes}
            ano={view.ano}
            onBack={() => setView({ screen: 'municipio', municipio: view.municipio })}
          />
        )}

        {view.screen === 'lancamento-secretaria' && (
          <PainelLancamento
            municipio={view.municipio}
            ubs={{ id: `sec-${view.secretaria.id}`, nome: view.secretaria.nome, endereco: '', municipio_id: view.municipio.id, secretaria_id: view.secretaria.id } as UBS}
            mes={view.mes}
            ano={view.ano}
            onBack={() => setView({ screen: 'secretaria', municipio: view.municipio, secretaria: view.secretaria })}
          />
        )}

        {view.screen === 'lancamento-outra-unidade' && (
          <PainelLancamento
            municipio={view.municipio}
            ubs={{ id: view.outraUnidade.id, nome: view.outraUnidade.nome, endereco: view.outraUnidade.endereco || '', municipio_id: view.municipio.id } as UBS}
            mes={view.mes}
            ano={view.ano}
            onBack={() => setView({ screen: 'municipio', municipio: view.municipio })}
          />
        )}

        {view.screen === 'dashboard' && (
          <Dashboard onBack={() => setView({ screen: 'home' })} />
        )}

        {view.screen === 'importar' && (
          <ImportarExcel onBack={() => setView({ screen: 'home' })} />
        )}
      </main>

      <ChatIA />
    </div>
  )
}
