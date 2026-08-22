import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description: "Como o ScooterGestor coleta, usa e protege os dados de lojas, oficinas e seus clientes.",
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-xl font-semibold mb-3">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  )
}

export default function PoliticaDePrivacidadePage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <h1 className="text-3xl font-bold">Política de Privacidade</h1>
      <p className="text-sm text-muted-foreground mt-2">Última atualização: 22 de agosto de 2026.</p>

      <Section title="1. Quem somos">
        <p>
          O ScooterGestor é um sistema de gestão (SaaS) voltado para lojas e oficinas de scooters
          elétricas, oferecido em regime de assinatura. Esta política explica quais dados
          coletamos, para que usamos e quais são os seus direitos, tanto se você é dono(a)/usuário(a)
          de uma loja que usa o ScooterGestor quanto se você é cliente de uma dessas lojas.
        </p>
      </Section>

      <Section title="2. Dados que coletamos">
        <p><strong className="text-foreground">Da loja e de seus usuários</strong> (quem contrata o sistema): nome, e-mail, telefone,
          CNPJ/CPF e endereço cadastrados na conta, além de dados de uso do sistema (login, ações
          realizadas) para fins de segurança e suporte.</p>
        <p><strong className="text-foreground">Dos clientes da loja</strong> (cadastrados pela loja dentro do sistema): nome, telefone/WhatsApp,
          e-mail, CPF/CNPJ e dados dos veículos (scooters) atendidos, histórico de ordens de serviço,
          orçamentos, vendas e garantias. Esses dados são inseridos e controlados pela própria loja —
          o ScooterGestor atua como operador técnico da infraestrutura onde esses dados ficam
          armazenados.</p>
        <p><strong className="text-foreground">Dados de cobrança</strong>: para lojas assinantes, processamos dados necessários à cobrança
          recorrente (nome, CNPJ/CPF, e-mail) através do nosso parceiro de pagamentos, a Asaas.</p>
      </Section>

      <Section title="3. Como usamos os dados">
        <p>Usamos os dados para: (i) operar e manter o sistema funcionando; (ii) processar pagamentos
          e cobranças da assinatura; (iii) dar suporte técnico via WhatsApp ou e-mail; (iv) enviar
          comunicações operacionais (ex: lembretes de revisão, status de ordem de serviço) através
          de links de WhatsApp gerados pelo próprio sistema, a critério de cada loja; (v) cumprir
          obrigações legais e prevenir fraude.</p>
      </Section>

      <Section title="4. Isolamento entre lojas">
        <p>Cada loja só acessa os dados que ela mesma cadastrou. Os dados de uma loja não ficam
          visíveis para outra loja em nenhuma hipótese, por controle técnico de acesso no banco de
          dados (isolamento por empresa).</p>
      </Section>

      <Section title="5. Compartilhamento com terceiros">
        <p>Compartilhamos dados estritamente necessários com:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong className="text-foreground">Asaas</strong> (processamento de pagamentos), para cobrança da assinatura da loja.</li>
          <li><strong className="text-foreground">Supabase</strong> (infraestrutura de banco de dados e autenticação), como operador técnico que
            hospeda os dados.</li>
        </ul>
        <p>Não vendemos dados pessoais a terceiros. Não enviamos mensagens automáticas via WhatsApp
          através de provedores externos — os links de WhatsApp gerados pelo sistema são abertos e
          enviados manualmente pelo usuário da loja.</p>
      </Section>

      <Section title="6. Retenção e exclusão">
        <p>Os dados ficam armazenados enquanto a assinatura da loja estiver ativa. Após o
          cancelamento, os dados continuam disponíveis para exportação por até 30 dias, findo esse
          prazo podem ser excluídos definitivamente, exceto quando a manutenção for exigida por lei
          (ex: obrigações fiscais).</p>
      </Section>

      <Section title="7. Seus direitos (LGPD)">
        <p>Nos termos da Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você pode solicitar a
          qualquer momento: confirmação da existência de tratamento, acesso, correção, anonimização,
          portabilidade, eliminação de dados e informação sobre com quem compartilhamos seus dados.
          Se você é cliente de uma loja que usa o ScooterGestor, solicitações sobre seus dados devem
          ser feitas primeiro diretamente à loja, que é a controladora desses dados; para dúvidas
          sobre a infraestrutura que os armazena, fale com a gente pelos canais abaixo.</p>
      </Section>

      <Section title="8. Contato">
        <p>
          Dúvidas sobre esta política:{" "}
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
