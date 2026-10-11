//* Components imports
import { FeedbackView } from "@/components/feedback/feedback-view"

const themeTitle = "A letter that arrives late"

const readyCorrection = {
  score: "720.00",
  content: [
    "O texto entrega a carta, mas a cena ainda conta o que a personagem sente em vez de mostrar.",
    "",
    '- **Cena**: 400. "A carta ficou sobre a mesa."',
    '- **Diálogo**: 320. "Ela disse que já era tarde."',
    "",
    "Nota: 720",
    "",
    "Na próxima versão, troque a explicação do atraso por um gesto: a personagem guarda a carta e não a abre.",
  ].join("\n"),
  textContent: "The letter sat on the table.",
}

export const Ready = () => (
  <FeedbackView themeTitle={themeTitle} correction={readyCorrection} />
)

export const Pending = () => (
  <FeedbackView themeTitle={themeTitle} correction={null} />
)
