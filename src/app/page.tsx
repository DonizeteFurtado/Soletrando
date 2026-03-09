"use client";

import { useState, useEffect, useRef } from "react";
import confetti from "canvas-confetti";

type Dificuldade = "facil" | "medio" | "dificil";

export default function SpellingGame() {
  const [filaDePalavras, setFilaDePalavras] = useState<string[]>([]);
  const [palavraAtual, setPalavraAtual] = useState<string>("");
  const [digitada, setDigitada] = useState<string>("");
  const [faseVerificacao, setFaseVerificacao] = useState<boolean>(false);
  const [jogoFinalizado, setJogoFinalizado] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  // New States for Difficulty and Loading
  const [dificuldadeEscolhida, setDificuldadeEscolhida] = useState<Dificuldade | null>(null);
  const [jogoIniciado, setJogoIniciado] = useState<boolean>(false);
  const [carregando, setCarregando] = useState<boolean>(false);
  const [errosSeguidos, setErrosSeguidos] = useState<number>(0);

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
    // Removed automatic iniciarJogo() call to wait for difficulty selection
  }, []);

  const embaralhar = (array: string[]) => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  const iniciarJogo = async (dificuldade?: Dificuldade) => {
    const dif = dificuldade || dificuldadeEscolhida;
    if (!dif) return;

    setCarregando(true);
    try {
      const response = await fetch("/words.json");
      const data = await response.json();

      const palavrasDaDificuldade = data[dif];
      const fila = embaralhar(palavrasDaDificuldade);

      setDificuldadeEscolhida(dif);
      setFilaDePalavras(fila);
      setJogoIniciado(true);
      prepararNovaRodada(fila);
      setJogoFinalizado(false);
    } catch (error) {
      console.error("Erro ao carregar palavras:", error);
      alert("Houve um erro ao carregar as palavras. Tente novamente.");
    } finally {
      setCarregando(false);
    }
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

  const voltarAoMenu = () => {
    setJogoIniciado(false);
    setJogoFinalizado(false);
    setDificuldadeEscolhida(null);
  };

  const ouvirPalavra = () => {
    if (!palavraAtual) return;

    // Cancela qualquer fala que ainda esteja acontecendo
    window.speechSynthesis.cancel();

    const msg = new SpeechSynthesisUtterance();
    msg.text = palavraAtual;
    msg.lang = "pt-BR";
    // Deixa pouquíssima coisa mais lento para facilitar o entendimento de crianças
    msg.rate = 0.8;
    msg.pitch = 1;

    // Tenta encontrar as vozes premium mais naturais disponíveis no sistema
    const vozes = window.speechSynthesis.getVoices();
    const vozPreferida = vozes.find(
      (voz) =>
        voz.lang === "pt-BR" &&
        (voz.name.includes("Google") ||
          voz.name.includes("Luciana") ||
          voz.name.includes("Microsoft") ||
          voz.name.includes("Felipe") ||
          voz.name.includes("Thiago"))
    ) || vozes.find((voz) => Math.abs(voz.lang.indexOf("pt-BR")) !== -1);

    if (vozPreferida) {
      msg.voice = vozPreferida;
    }

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
      setErrosSeguidos(0);
      somAcertoRef.current?.play();
      dispararConfetes();
    } else {
      setIsCorrect(false);
      setErrosSeguidos((prev) => prev + 1);
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
          <span className="text-indigo-200/60 text-xs mb-2 font-bold uppercase tracking-widest">
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
                    ? "bg-emerald-900/40 text-emerald-400 border-emerald-500/40"
                    : "bg-rose-900/60 text-rose-100 border-rose-400"
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
          <div className="flex flex-col items-center bg-rose-950/60 py-4 px-6 rounded-2xl border border-rose-500/40 w-full animate-fade-in shadow-inner backdrop-blur-md">
            <span className="text-rose-200 text-xs md:text-sm mb-3 font-bold uppercase tracking-widest">
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
                      : "bg-emerald-600 text-white border-emerald-400 scale-110 shadow-[0_0_15px_rgba(16,185,129,0.5)] z-10"
                      } transition-all`}
                  >
                    {letraCorreta}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Change Difficulty Prompt after 5 consecutive errors */}
        {!isCorrect && errosSeguidos >= 5 && (
          <div className="flex flex-col items-center bg-amber-900/80 py-4 px-6 rounded-2xl border border-amber-500/50 w-full animate-fade-in shadow-[0_0_30px_rgba(245,158,11,0.2)] backdrop-blur-md mt-4">
            <h3 className="text-amber-100 font-bold text-lg mb-2 flex items-center">
              <span className="mr-2 text-2xl">⚠️</span> Que tal darmos um passo atrás?
            </h3>
            <p className="text-amber-200/90 text-sm mb-4 text-center">
              Parece que as palavras estão bem difíceis! Gostaria de mudar para um nível mais fácil para treinar um pouco mais?
            </p>
            <div className="flex space-x-4 w-full">
              <button
                onClick={voltarAoMenu}
                className="flex-1 py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow-md transition-all border border-amber-400/50"
              >
                SIM, MUDAR NÍVEL
              </button>
              <button
                onClick={() => setErrosSeguidos(0)}
                className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-amber-100 font-bold rounded-xl transition-all border border-amber-500/30"
              >
                NÃO, VOU CONTINUAR
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4 relative bg-slate-950 overflow-hidden"
    >
      {/* Animated gradient background for premium UI/UX */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 opacity-80 mix-blend-multiply"></div>
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/30 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-violet-600/30 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="z-10 w-full max-w-2xl rounded-3xl p-8 md:p-12 text-center transition-all duration-500 ease-in-out bg-black/40 backdrop-blur-2xl border border-white/10 shadow-[0_8px_40px_rgba(0,0,0,0.5)]">
        {!jogoIniciado ? (
          <div className="flex flex-col items-center space-y-8 animate-fade-in">
            <h1 className="text-4xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-indigo-300 to-violet-400 drop-shadow-sm uppercase tracking-tight mb-4">
              Soletrando
            </h1>
            <p className="text-xl text-indigo-100/80 font-medium mb-8">
              Escolha o nível de dificuldade para começar:
            </p>

            <div className="flex flex-col w-full max-w-xs space-y-4">
              <button
                onClick={() => iniciarJogo("facil")}
                disabled={carregando}
                className="w-full py-4 bg-gradient-to-r from-emerald-600 to-emerald-800 hover:from-emerald-500 hover:to-emerald-700 text-white font-extrabold text-xl rounded-2xl shadow-lg transition-all tracking-wider border border-emerald-500/50 disabled:opacity-50"
              >
                FÁCIL
              </button>
              <button
                onClick={() => iniciarJogo("medio")}
                disabled={carregando}
                className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-white font-extrabold text-xl rounded-2xl shadow-lg transition-all tracking-wider border border-amber-500/50 disabled:opacity-50"
              >
                MÉDIO
              </button>
              <button
                onClick={() => iniciarJogo("dificil")}
                disabled={carregando}
                className="w-full py-4 bg-gradient-to-r from-rose-600 to-rose-800 hover:from-rose-500 hover:to-rose-700 text-white font-extrabold text-xl rounded-2xl shadow-lg transition-all tracking-wider border border-rose-500/50 disabled:opacity-50"
              >
                DIFÍCIL
              </button>
            </div>

            {carregando && (
              <p className="text-indigo-300 mt-4 animate-pulse font-medium">
                Carregando palavras...
              </p>
            )}
          </div>
        ) : jogoFinalizado ? (
          <div className="flex flex-col items-center space-y-6 animate-fade-in">
            <h1 className="text-7xl drop-shadow-2xl">🏆</h1>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mt-4 drop-shadow-md">
              Parabéns!
            </h1>
            <p className="text-xl text-indigo-200 font-medium">
              Você finalizou o desafio nível {dificuldadeEscolhida?.toUpperCase()}!
            </p>
            <div className="flex flex-col w-full max-w-sm space-y-4 mt-8">
              <button
                onClick={() => iniciarJogo()}
                className="w-full px-8 py-4 bg-gradient-to-r from-indigo-500 to-violet-700 hover:from-indigo-400 hover:to-violet-600 text-white font-extrabold text-lg tracking-wide rounded-full shadow-lg transform hover:-translate-y-1 transition-all border border-indigo-500/50"
              >
                JOGAR NOVAMENTE
              </button>
              <button
                onClick={voltarAoMenu}
                className="w-full px-8 py-4 bg-transparent hover:bg-white/5 text-indigo-200 font-bold text-lg tracking-wide rounded-full border border-indigo-500/30 hover:border-indigo-400 transition-all"
              >
                VOLTAR AO MENU
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-6">
            <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-indigo-300 to-violet-400 drop-shadow-sm mb-2 uppercase tracking-tight">
              Soletrando
            </h1>

            <div className="inline-block px-5 py-2 bg-indigo-950/40 text-indigo-100 border border-indigo-800/40 rounded-full font-medium shadow-inner mb-6 uppercase tracking-wider text-sm">
              Palavras restantes: {filaDePalavras.length + 1}
            </div>

            <div className="flex flex-col w-full max-w-xs space-y-3">
              <button
                onClick={ouvirPalavra}
                className="group relative flex items-center justify-center w-full px-6 py-4 bg-white/5 text-white border border-indigo-500/30 hover:bg-white/10 hover:border-indigo-400 font-bold text-lg rounded-2xl shadow-[0_4px_20px_rgba(99,102,241,0.15)] backdrop-blur-sm transition-all mx-auto"
              >
                <span className="text-2xl mr-3 group-hover:scale-110 transition-transform">
                  🔊
                </span>
                OUVIR PALAVRA
              </button>
              <button
                onClick={voltarAoMenu}
                className="flex items-center justify-center w-full px-4 py-2 bg-transparent text-indigo-300/70 hover:text-white text-sm font-medium rounded-xl hover:bg-white/5 transition-all"
              >
                Trocar Dificuldade
              </button>
            </div>

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
                    className="w-full px-6 py-5 text-center text-3xl md:text-4xl font-extrabold uppercase bg-white/5 text-indigo-50 border-2 border-indigo-900/50 focus:border-indigo-400 focus:bg-white/10 rounded-2xl shadow-inner outline-none transition-all placeholder-indigo-200/30 tracking-widest backdrop-blur-sm"
                  />
                  <button
                    type="submit"
                    disabled={!digitada.trim()}
                    className="w-full py-4 bg-gradient-to-r from-indigo-500 to-violet-700 hover:from-indigo-400 hover:to-violet-600 disabled:from-white/5 disabled:to-white/5 disabled:text-white/30 disabled:border-white/10 disabled:cursor-not-allowed border border-indigo-400/50 text-white font-extrabold text-xl rounded-2xl shadow-[0_4px_20px_rgba(99,102,241,0.3)] transition-all tracking-wider transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    VERIFICAR
                  </button>
                </form>
              ) : (
                <div className="flex flex-col space-y-8 animate-fade-in w-full">
                  <div className="flex flex-wrap justify-center items-center py-6 px-2 bg-white/5 rounded-2xl shadow-inner min-h-[100px] border border-white/5 backdrop-blur-sm">
                    {renderResultadoHTML()}
                  </div>

                  <div className="text-2xl font-bold min-h-[80px] flex items-center justify-center">
                    {isCorrect ? (
                      <span className="text-emerald-300 drop-shadow-md flex items-center justify-center text-2xl md:text-3xl bg-emerald-900/40 px-6 py-3 rounded-xl border border-emerald-500/40 backdrop-blur-sm">
                        ✨ VOCÊ ACERTOU! ✨
                      </span>
                    ) : (
                      <span className="text-rose-200 drop-shadow-md flex items-center justify-center text-2xl md:text-3xl bg-rose-900/60 px-6 py-3 rounded-xl border border-rose-500/40 backdrop-blur-sm">
                        ❌ VOCÊ ERROU! ❌
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => prepararNovaRodada()}
                    autoFocus
                    className="w-full py-4 bg-white/10 hover:bg-white/20 text-white hover:text-indigo-100 font-extrabold text-xl rounded-2xl shadow-md border border-indigo-500/30 hover:border-indigo-400 transition-all flex items-center justify-center tracking-wider backdrop-blur-sm"
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
