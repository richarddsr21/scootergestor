import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Termos de Uso",
  description: "Condições de uso do sistema ScooterGestor para lojas e oficinas de scooters elétricas.",
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-xl font-semibold mb-3">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  )
}

export default function TermosDeUsoPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <h1 className="text-3xl font-bold">Termos de Uso</h1>
      <p className="text-sm text-muted-foreground mt-2">Última atualização: 22 de agosto de 2026.</p>

      <Section title="1. Aceitação">
        <p>Ao criar uma conta e usar o ScooterGestor, você concorda com estes Termos de Uso e com a
          nossa Política de Privacidade. Se você está criando a conta em nome de uma loja ou
          empresa, declara ter poderes para vinculá-la a estes termos.</p>
      </Section>

      <Section title="2. O que é o serviço">
        <p>O ScooterGestor é um sistema de gestão em nuvem para lojas e oficinas de scooters
          elétricas, com módulos de clientes, estoque, vendas, ordens de serviço, orçamentos,
          garantias e financeiro. O serviço é oferecido por assinatura mensal recorrente, plano
          Pro, cobrado através da Asaas.</p>
      </Section>

      <Section title="3. Cadastro e responsabilidade pela conta">
        <p>Você é responsável por manter a confidencialidade das credenciais de acesso da sua conta e
          por todas as ações realizadas nela, incluindo as de usuários que você convidar para a sua
          loja. Você é responsável pela veracidade dos dados cadastrados, próprios e dos seus
          clientes.</p>
      </Section>

      <Section title="4. Assinatura, cobrança e cancelamento">
        <p>A assinatura é cobrada mensalmente de forma recorrente. O acesso ao sistema pode ser
          suspenso em caso de atraso ou falha no pagamento, após tentativas de cobrança. Você pode
          cancelar a assinatura a qualquer momento, sem multa de fidelidade; após o cancelamento,
          seus dados ficam disponíveis para exportação por até 30 dias.</p>
      </Section>

      <Section title="5. Uso aceitável">
        <p>Você concorda em não usar o ScooterGestor para: violar leis aplicáveis; armazenar dados que
          não tenha o direito de coletar de seus clientes; tentar acessar dados de outras lojas;
          interferir na operação normal do sistema ou tentar burlar seus limites técnicos.</p>
      </Section>

      <Section title="6. Propriedade dos dados">
        <p>Os dados que você e seus clientes inserem no sistema (cadastros, histórico de OS, vendas,
          financeiro) pertencem a você/sua loja. O ScooterGestor atua como fornecedor da plataforma
          que processa e armazena esses dados, nos termos da nossa Política de Privacidade.</p>
      </Section>

      <Section title="7. Disponibilidade e limitações">
        <p>Fazemos esforços razoáveis para manter o sistema disponível, mas não garantimos operação
          ininterrupta ou livre de falhas. Podemos realizar manutenções programadas, avisando com
          antecedência razoável quando possível. Não nos responsabilizamos por perdas decorrentes de
          uso indevido do sistema, falhas de conexão do usuário ou de terceiros (ex: provedores de
          pagamento ou WhatsApp).</p>
      </Section>

      <Section title="8. Alterações nestes termos">
        <p>Podemos atualizar estes Termos de Uso periodicamente. Alterações relevantes serão
          comunicadas pelos canais de contato cadastrados. O uso contínuo do sistema após uma
          atualização representa concordância com os novos termos.</p>
      </Section>

      <Section title="9. Encerramento">
        <p>Podemos suspender ou encerrar contas que violem estes termos, com aviso prévio quando
          possível, exceto em casos de risco à segurança do sistema ou de outras lojas.</p>
      </Section>

      <Section title="10. Contato">
        <p>
          Dúvidas sobre estes termos:{" "}
          <a href="mailto:contato@scootergestor.com.br" className="text-foreground underline underline-offset-2">
            contato@scootergestor.com.br
          </a>{" "}
          ou WhatsApp{" "}
          <a
            href="https://wa.me/5521988729352"
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground underline underline-offset-2"
          >
            (21) 9 8872-9352
          </a>
          .
        </p>
      </Section>

      <p className="mt-10 text-xs text-muted-foreground">
        Este documento é um modelo geral e pode não cobrir particularidades do seu negócio.
        Recomendamos revisão por um profissional jurídico antes de considerá-lo definitivo.
      </p>
    </div>
  )
}
