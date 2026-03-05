"use client";

import { useState, useEffect, useRef } from "react";
import confetti from "canvas-confetti";

const palavrasOriginais = [
  "EXCEÇÃO",
  "COMPREENSÃO",
  "ANSEIO",
  "MENDIGO",
  "REITERAR",
  "SUBSÍDIO",
  "XÍCARA",
  "CHASSIS",
  "PROSSEGUIR",
  "EMPECILHO",
  "RETIFICAR",
  "BANALIZAR",
  "CONSCIENTIZAR",
  "AZEITE",
  "PISCINA",
  "HIDRÁULICO",
  "ESTOICISMO",
  "METAMORFOSE",
  "RECORDE",
  "RUBRICA",
];

export default function SpellingGame() {
  const [filaDePalavras, setFilaDePalavras] = useState<string[]>([]);
  const [palavraAtual, setPalavraAtual] = useState<string>("");
  const [digitada, setDigitada] = useState<string>("");
  const [faseVerificacao, setFaseVerificacao] = useState<boolean>(false);
  const [jogoFinalizado, setJogoFinalizado] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  // Audio elements (created on client side only)
  const somAcertoRef = useRef<HTMLAudioElement | null>(null);
  const somErroRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialize audio only in the browser
    somAcertoRef.current = new Audio(
      "https://www.myinstants.com/media/sounds/acertou-faustao.mp3"
    );
    somErroRef.current = new Audio(
      "https://www.myinstants.com/media/sounds/errou-faustao.mp3"
    );
    iniciarJogo();
  }, []);

  const embaralhar = (array: string[]) => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  const iniciarJogo = () => {
    const fila = embaralhar(palavrasOriginais);
    setFilaDePalavras(fila);
    prepararNovaRodada(fila);
    setJogoFinalizado(false);
  };

  const prepararNovaRodada = (filaAtual?: string[]) => {
    const fila = filaAtual || filaDePalavras;

    if (fila.length === 0) {
      finalizarJogo();
      return;
    }

    const novaPalavra = fila[0];
    setFilaDePalavras(fila.slice(1));
    setPalavraAtual(novaPalavra);
    setDigitada("");
    setFaseVerificacao(false);
    setIsCorrect(null);

    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const ouvirPalavra = () => {
    if (!palavraAtual) return;
    const msg = new SpeechSynthesisUtterance();
    msg.text = palavraAtual;
    msg.lang = "pt-BR";
    msg.rate = 0.8;
    window.speechSynthesis.speak(msg);
  };

  const dispararConfetes = () => {
    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
  };

  const validar = () => {
    const _digitada = digitada.trim().toUpperCase();
    const correta = palavraAtual.toUpperCase();

    let erro = false;
    for (let i = 0; i < correta.length; i++) {
      if (_digitada[i] !== correta[i]) {
        erro = true;
        break;
      }
    }

    if (_digitada.length !== correta.length) erro = true;

    if (!erro) {
      setIsCorrect(true);
      somAcertoRef.current?.play();
      dispararConfetes();
    } else {
      setIsCorrect(false);
      somErroRef.current?.play();
    }

    setFaseVerificacao(true);
  };

  const finalizarJogo = () => {
    setJogoFinalizado(true);
    dispararConfetes();
  };

  const renderResultadoHTML = () => {
    const _correta = palavraAtual.toUpperCase();
    const _digitada = digitada.trim().toUpperCase();

    return (
      <div className="flex flex-col w-full items-center justify-center space-y-6">
        {/* User's Input */}
        <div className="flex flex-col items-center">
          <span className="text-red-200/60 text-xs mb-2 font-bold uppercase tracking-widest">
            O QUE VOCÊ DIGITOU:
          </span>
          <div className="flex flex-wrap justify-center">
            {_correta.split("").map((letraCorreta, idx) => {
              const letraUsuario = _digitada[idx];
              const taCerto = letraCorreta === letraUsuario;
              const exibida = letraUsuario || "_";

              return (
                <span
                  key={`user-${idx}`}
                  className={`animated-letter font-bold text-3xl md:text-5xl mx-1 p-2 md:w-16 md:h-16 flex items-center justify-center rounded-md shadow-sm border-2 ${taCerto
                    ? "bg-green-900/40 text-green-400 border-green-500/40"
                    : "bg-red-900/60 text-red-100 border-red-400"
                    }`}
                  style={{ animationDelay: `${idx * 0.05}s` }}
                >
                  {exibida}
                </span>
              );
            })}
          </div>
        </div>

        {/* Correct Spelling shown only if there is an error */}
        {!isCorrect && (
          <div className="flex flex-col items-center bg-red-950/60 py-4 px-6 rounded-2xl border border-red-500/40 w-full animate-fade-in shadow-inner backdrop-blur-md">
            <span className="text-red-200 text-xs md:text-sm mb-3 font-bold uppercase tracking-widest">
              COMO SE ESCREVE CORRETAMENTE:
            </span>
            <div className="flex flex-wrap justify-center">
              {_correta.split("").map((letraCorreta, idx) => {
                const letraUsuario = _digitada[idx];
                const taCerto = letraCorreta === letraUsuario;

                return (
                  <span
                    key={`correct-${idx}`}
                    className={`font-bold text-2xl md:text-4xl mx-1 p-2 md:w-12 md:h-12 flex items-center justify-center rounded-md border ${taCerto
                      ? "bg-white/5 text-white/40 border-white/5"
                      : "bg-green-700 text-white border-green-400 scale-110 shadow-[0_0_15px_rgba(72,187,120,0.6)] z-10"
                      } transition-all`}
                  >
                    {letraCorreta}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat flex flex-col items-center justify-center p-4 relative"
      style={{
        backgroundImage: 'url("/background.jpg")',
      }}
    >
      {/* Background overlay for better contrast - lighter than before */}
      <div className="absolute inset-0 bg-black/60 z-0"></div>

      <div className="z-10 w-full max-w-2xl rounded-3xl p-8 md:p-12 text-center transition-all duration-500 ease-in-out bg-black/30 backdrop-blur-2xl border border-red-700/30 shadow-[0_8px_40px_rgba(200,30,30,0.2)]">
        {jogoFinalizado ? (
          <div className="flex flex-col items-center space-y-6 animate-fade-in">
            <h1 className="text-7xl drop-shadow-2xl">🏆</h1>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mt-4 drop-shadow-md">
              Parabéns!
            </h1>
            <p className="text-xl text-red-100 font-medium">
              Você finalizou o desafio de soletração!
            </p>
            <button
              onClick={iniciarJogo}
              className="mt-8 px-8 py-4 bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white font-extrabold text-lg tracking-wide rounded-full shadow-lg transform hover:-translate-y-1 transition-all"
            >
              RECOMEÇAR JOGO
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-6">
            <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-red-300 to-red-600 drop-shadow-sm mb-2 uppercase tracking-tight">
              Soleteens 🎤
            </h1>

            <div className="inline-block px-5 py-2 bg-red-950/40 text-red-100 border border-red-800/40 rounded-full font-medium shadow-inner mb-6 uppercase tracking-wider text-sm">
              Palavras restantes: {filaDePalavras.length + 1}
            </div>

            <button
              onClick={ouvirPalavra}
              className="group relative flex items-center justify-center w-full max-w-xs px-6 py-4 bg-white/5 text-white border border-red-500/30 hover:bg-white/10 hover:border-red-400 font-bold text-lg rounded-2xl shadow-md backdrop-blur-sm transition-all mx-auto"
            >
              <span className="text-2xl mr-3 group-hover:scale-110 transition-transform">
                🔊
              </span>
              OUVIR PALAVRA
            </button>

            <div className="w-full mt-8">
              {!faseVerificacao ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (digitada.trim() !== "") validar();
                  }}
                  className="flex flex-col space-y-4"
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={digitada}
                    onChange={(e) => setDigitada(e.target.value)}
                    placeholder="DIGITE AQUI..."
                    autoComplete="off"
                    spellCheck="false"
                    className="w-full px-6 py-5 text-center text-3xl md:text-4xl font-extrabold uppercase bg-white/5 text-red-50 border-2 border-red-900/50 focus:border-red-400 focus:bg-white/10 rounded-2xl shadow-inner outline-none transition-all placeholder-red-200/40 tracking-widest backdrop-blur-sm"
                  />
                  <button
                    type="submit"
                    disabled={!digitada.trim()}
                    className="w-full py-4 bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 disabled:from-white/5 disabled:to-white/5 disabled:text-white/30 disabled:border-white/10 disabled:cursor-not-allowed border border-red-500/50 text-white font-extrabold text-xl rounded-2xl shadow-lg transition-all tracking-wider"
                  >
                    VERIFICAR
                  </button>
                </form>
              ) : (
                <div className="flex flex-col space-y-8 animate-fade-in w-full">
                  <div className="flex flex-wrap justify-center items-center py-6 px-2 bg-white/5 rounded-2xl shadow-inner min-h-[100px] border border-red-700/20 backdrop-blur-sm">
                    {renderResultadoHTML()}
                  </div>

                  <div className="text-2xl font-bold min-h-[80px] flex items-center justify-center">
                    {isCorrect ? (
                      <span className="text-green-300 drop-shadow-md flex items-center justify-center text-3xl bg-green-900/40 px-6 py-3 rounded-xl border border-green-500/40 backdrop-blur-sm">
                        ✨ VOCÊ ACERTOU! ✨
                      </span>
                    ) : (
                      <span className="text-red-200 drop-shadow-md flex items-center justify-center text-3xl bg-red-900/60 px-6 py-3 rounded-xl border border-red-500/40 backdrop-blur-sm">
                        ❌ VOCÊ ERROU! ❌
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => prepararNovaRodada()}
                    autoFocus
                    className="w-full py-4 bg-white/10 hover:bg-white/20 text-white hover:text-red-100 font-extrabold text-xl rounded-2xl shadow-md border border-red-500/30 hover:border-red-400 transition-all flex items-center justify-center tracking-wider backdrop-blur-sm"
                  >
                    PRÓXIMA PALAVRA
                    <span className="ml-2 text-2xl">➔</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
