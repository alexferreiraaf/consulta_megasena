import React, { useState, useEffect } from 'react';
import { Calendar, Trophy, ChevronRight, RefreshCw, AlertCircle, MapPin, Menu, X } from 'lucide-react';
import { LOTTERIES } from './constants/lotteries';

function App() {
    const [selectedLottery, setSelectedLottery] = useState(LOTTERIES.megasena);
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [suggestion, setSuggestion] = useState(null);
    const [expandedConcurso, setExpandedConcurso] = useState(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Update theme colors when lottery changes
    useEffect(() => {
        const root = document.documentElement;
        root.style.setProperty('--lottery-primary', selectedLottery.color);
        root.style.setProperty('--lottery-dark', selectedLottery.colorDark);
        root.style.setProperty('--lottery-light', selectedLottery.colorLight);
        
        // Reset state for new lottery
        setSuggestion(null);
        setSearchTerm('');
        setExpandedConcurso(null);
        fetchData();
    }, [selectedLottery.id]);

    const toggleConcurso = (numero) => {
        if (expandedConcurso === numero) {
            setExpandedConcurso(null);
        } else {
            setExpandedConcurso(numero);
        }
    };

    const formatWinners = (winners) => {
        if (!winners || winners.length === 0) return null;

        return winners.map(w => {
            const city = w.municipio === 'CANAL ELETRONICO' ? 'Canal Eletrônico' : w.municipio;
            const uf = w.uf && w.uf !== '--' ? `/${w.uf}` : '';
            const count = w.ganhadores > 1 ? ` (${w.ganhadores})` : '';
            return `${city}${uf}${count}`;
        }).join(', ');
    };

    const generateSuggestion = () => {
        if (data.length === 0) return;

        // Pega os últimos 20 resultados para análise
        const recentResults = data.slice(0, 20);
        const frequency = {};

        recentResults.forEach(concurso => {
            concurso.listaDezenas.forEach(num => {
                const n = parseInt(num);
                frequency[n] = (frequency[n] || 0) + 1;
            });
        });

        // Ordenar números por frequência
        const sortedNumbers = Object.keys(frequency)
            .map(n => parseInt(n))
            .sort((a, b) => frequency[b] - frequency[a]);

        // Pegar os 12 mais frequentes
        const hotNumbers = sortedNumbers.slice(0, 12);

        const selected = new Set();

        // Tenta pegar 4 dos "quentes"
        while (selected.size < Math.floor(selectedLottery.rules.balls * 0.6) && hotNumbers.length >= 4) {
            const index = Math.floor(Math.random() * hotNumbers.length);
            selected.add(hotNumbers[index]);
        }

        // Completa com números aleatórios até ter o total de bolas
        while (selected.size < selectedLottery.rules.balls) {
            const randomNum = Math.floor(Math.random() * (selectedLottery.rules.max - selectedLottery.rules.min + 1)) + selectedLottery.rules.min;
            selected.add(randomNum);
        }

        setSuggestion(Array.from(selected).sort((a, b) => a - b));
    };

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            // Fetch from heroku API
            const response = await fetch(selectedLottery.apiEndpoint);
            if (!response.ok) throw new Error('Falha ao buscar dados');
            const result = await response.json();
            
            const results = Array.isArray(result) ? result : [result];

            // Map results
            const mappedData = results.map(item => ({
                numero: item.concurso,
                dataApuracao: item.data,
                listaDezenas: item.dezenas,
                acumulado: item.acumulou,
                dataProximoConcurso: item.dataProximoConcurso,
                valorEstimadoProximoConcurso: item.valorEstimadoProximoConcurso,
                localSorteio: item.local,
                ganhadoresLocal: item.localGanhadores || [],
                premiacoes: item.premiacoes ? item.premiacoes.map(p => ({
                    descricao: p.descricao,
                    ganhadores: p.ganhadores,
                    valorPremio: p.valorPremio
                })) : []
            }));

            // Convert to array and sort by number descending
            const finalData = mappedData.sort((a, b) => b.numero - a.numero);

            setData(finalData);
        } catch (err) {
            setError('Ocorreu um erro ao carregar os resultados. Por favor, tente novamente mais tarde.');
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleLotteryChange = (lottery) => {
        setSelectedLottery(lottery);
        setIsMenuOpen(false);
    };

    const latest = data[0];
    const history = data.slice(1);

    const filteredHistory = history.filter(concurso => {
        const query = searchTerm.toLowerCase();
        return (
            concurso.numero.toString().includes(query) ||
            concurso.dataApuracao.toLowerCase().includes(query)
        );
    });

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <RefreshCw className="w-12 h-12 text-lottery-primary animate-spin" />
                    <p className="text-gray-600 font-medium text-lg">Carregando resultados...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border-t-8 border-red-500">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Ops! Algo deu errado.</h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <button
                        onClick={fetchData}
                        className="bg-lottery-primary hover:bg-lottery-dark text-white font-bold py-3 px-8 rounded-full transition-all flex items-center gap-2 mx-auto"
                    >
                        <RefreshCw className="w-5 h-5" /> Tentar Novamente
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            {/* Header */}
            <header className="bg-lottery-dark text-white py-6 px-4 shadow-lg sticky top-0 z-20">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="p-2 hover:bg-white/10 rounded-xl transition-colors md:hidden"
                        >
                            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                        
                        <div className="flex items-center gap-2">
                            <div className="bg-white p-1 rounded-full">
                                <div className="w-8 h-8 rounded-full border-4 border-lottery-primary flex items-center justify-center text-lottery-primary font-black">
                                    {selectedLottery.label}
                                </div>
                            </div>
                            <h1 className="text-2xl font-black italic tracking-tighter">{selectedLottery.name}</h1>
                        </div>
                    </div>

                    <nav className="hidden md:flex items-center gap-1">
                        {Object.values(LOTTERIES).map((lottery) => (
                            <button
                                key={lottery.id}
                                onClick={() => handleLotteryChange(lottery)}
                                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                                    selectedLottery.id === lottery.id 
                                    ? 'bg-white text-lottery-dark shadow-md scale-105' 
                                    : 'hover:bg-white/10 text-white/80'
                                }`}
                            >
                                {lottery.name}
                            </button>
                        ))}
                    </nav>

                    <button onClick={fetchData} className="p-2 hover:bg-white/10 rounded-full transition-colors hidden sm:block">
                        <RefreshCw className="w-6 h-6" />
                    </button>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="absolute top-full left-0 right-0 bg-lottery-dark border-t border-white/10 shadow-2xl md:hidden animate-in slide-in-from-top duration-300">
                        <div className="p-4 space-y-2">
                            {Object.values(LOTTERIES).map((lottery) => (
                                <button
                                    key={lottery.id}
                                    onClick={() => handleLotteryChange(lottery)}
                                    className={`w-full text-left px-5 py-4 rounded-2xl font-black italic flex items-center justify-between transition-all ${
                                        selectedLottery.id === lottery.id 
                                        ? 'bg-white text-lottery-dark shadow-lg translate-x-2' 
                                        : 'text-white/70 hover:bg-white/5'
                                    }`}
                                >
                                    {lottery.name}
                                    {selectedLottery.id === lottery.id && <ChevronRight className="w-5 h-5" />}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </header>

            <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-6 space-y-8">
                {/* Latest Result Card */}
                {latest && (
                    <section className="bg-white rounded-3xl overflow-hidden shadow-2xl border border-gray-100">
                        <div className="bg-lottery-primary p-6 text-white text-center relative overflow-hidden">
                            {/* Decorative circles */}
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full"></div>
                            <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-white/5 rounded-full"></div>

                            <p className="uppercase tracking-widest text-sm font-bold opacity-80 mb-1">Último Resultado</p>
                            <h2 className="text-4xl font-black mb-1">Concurso {latest.numero}</h2>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 opacity-90 text-sm mt-3">
                                <div className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    <span>{latest.dataApuracao}</span>
                                </div>
                                {!latest.acumulado && latest.ganhadoresLocal && latest.ganhadoresLocal.length > 0 ? (
                                    <div className="flex items-center gap-1 bg-yellow-400/20 text-yellow-100 px-3 py-1 rounded-full font-bold">
                                        <Trophy className="w-4 h-4" />
                                        <span>Ganhador em: {formatWinners(latest.ganhadoresLocal)}</span>
                                    </div>
                                ) : latest.localSorteio && (
                                    <div className="flex items-center gap-1">
                                        <MapPin className="w-4 h-4" />
                                        <span>{latest.localSorteio}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-8 space-y-8">
                            {/* Dezenas */}
                            <div className="flex flex-wrap justify-center gap-3 md:gap-5">
                                {latest.listaDezenas.map((dezena, idx) => (
                                    <div
                                        key={idx}
                                        className="w-14 h-14 md:w-20 md:h-20 bg-lottery-primary text-white rounded-full flex items-center justify-center text-2xl md:text-4xl font-black shadow-lg border-4 border-white transform hover:scale-110 transition-transform cursor-default"
                                    >
                                        {dezena}
                                    </div>
                                ))}
                            </div>

                            {/* Status and Next Prize */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                                <div className={`p-6 rounded-2xl flex flex-col items-center justify-center text-center ${latest.acumulado ? 'bg-yellow-50 border border-yellow-100' : 'bg-lottery-primary/5 border border-lottery-primary/10'}`}>
                                    <Trophy className={`w-10 h-10 mb-2 ${latest.acumulado ? 'text-yellow-600' : 'text-lottery-primary'}`} />
                                    <p className="text-sm font-bold text-gray-500 uppercase">Resultado</p>
                                    <p className={`text-xl font-black ${latest.acumulado ? 'text-yellow-700' : 'text-lottery-primary'}`}>
                                        {latest.acumulado ? 'ACUMULOU!' : 'SAIU O PRÊMIO!'}
                                    </p>
                                </div>

                                <div className="p-6 rounded-2xl bg-lottery-primary/5 border border-lottery-primary/10 flex flex-col items-center justify-center text-center">
                                    <p className="text-sm font-bold text-gray-500 uppercase">Próximo Concurso</p>
                                    <p className="text-3xl font-black text-lottery-dark">
                                        {latest.valorEstimadoProximoConcurso ?
                                            latest.valorEstimadoProximoConcurso.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) :
                                            'Aguardando...'}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1 font-medium">Sorteio em {latest.dataProximoConcurso}</p>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* Game Generator Section */}
                <section className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-gray-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-lottery-primary/5 rounded-bl-full -z-0"></div>

                    <div className="relative z-10">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                            <div>
                                <h3 className="text-xl font-black text-gray-800 flex items-center gap-2">
                                    <Trophy className="w-6 h-6 text-lottery-primary" />
                                    Gerador de Palpites
                                </h3>
                                <p className="text-sm text-gray-500 font-medium">Sugerindo números com base na frequência dos últimos 20 sorteios</p>
                            </div>
                            <button
                                onClick={generateSuggestion}
                                className="bg-lottery-primary hover:bg-lottery-dark text-white font-bold py-3 px-6 rounded-2xl transition-all shadow-lg hover:shadow-lottery-primary/20 flex items-center justify-center gap-2 active:scale-95"
                            >
                                <RefreshCw className={`w-5 h-5 ${suggestion ? '' : 'animate-spin'}`} />
                                {suggestion ? 'Gerar Novo Palpite' : 'Gerar Palpite'}
                            </button>
                        </div>

                        {suggestion ? (
                            <div className="flex flex-wrap justify-center gap-3 animate-in fade-in zoom-in duration-500">
                                {suggestion.map((num, i) => (
                                    <div
                                        key={i}
                                        className="w-12 h-12 md:w-16 md:h-16 bg-white border-4 border-lottery-primary text-lottery-primary rounded-full flex items-center justify-center text-xl md:text-2xl font-black shadow-md"
                                    >
                                        {num.toString().padStart(2, '0')}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center">
                                <p className="text-gray-400 font-medium italic">Clique no botão para ver uma sugestão de jogo.</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* History List */}
                <section className="space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
                        <div className="flex items-center gap-2">
                            <h3 className="text-xl font-bold text-gray-800">Concursos Anteriores</h3>
                        </div>

                        <div className="relative group flex-1 max-w-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <RefreshCw className={`w-4 h-4 text-gray-400 group-focus-within:text-lottery-primary transition-colors ${loading ? 'animate-spin' : ''}`} />
                            </div>
                            <input
                                type="text"
                                placeholder="Filtrar por concurso ou data..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-lottery-primary/20 focus:border-lottery-primary sm:text-sm transition-all shadow-sm"
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        {filteredHistory.length > 0 ? (
                            filteredHistory.map((concurso) => {
                                const isExpanded = expandedConcurso === concurso.numero;

                                return (
                                    <div key={concurso.numero} className="bg-white rounded-2xl shadow hover:shadow-md transition-all border border-gray-100 overflow-hidden">
                                        {/* Main Row */}
                                        <div
                                            onClick={() => toggleConcurso(concurso.numero)}
                                            className="p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-gray-50/50"
                                        >
                                            <div className="flex items-center justify-between md:justify-start gap-4">
                                                <div className="bg-gray-100 px-3 py-1 rounded-lg">
                                                    <span className="text-xs font-bold text-gray-400 uppercase leading-none block">Nº</span>
                                                    <span className="text-lg font-black text-gray-700">{concurso.numero}</span>
                                                </div>
                                                <div>
                                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs text-gray-400 font-bold mb-1">
                                                        <div className="flex items-center gap-1">
                                                            <Calendar className="w-3 h-3" /> {concurso.dataApuracao}
                                                        </div>
                                                        {!concurso.acumulado && concurso.ganhadoresLocal && concurso.ganhadoresLocal.length > 0 ? (
                                                            <div className="flex items-center gap-1 max-w-[150px] sm:max-w-[200px]" title={formatWinners(concurso.ganhadoresLocal)}>
                                                                <Trophy className="w-3 h-3 flex-shrink-0 text-yellow-500" />
                                                                <span className="truncate text-yellow-600 font-bold">{formatWinners(concurso.ganhadoresLocal)}</span>
                                                            </div>
                                                        ) : concurso.localSorteio && (
                                                            <div className="flex items-center gap-1 max-w-[150px] sm:max-w-[200px]" title={concurso.localSorteio}>
                                                                <MapPin className="w-3 h-3 flex-shrink-0" />
                                                                <span className="truncate">{concurso.localSorteio}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex gap-1.5">
                                                        {concurso.listaDezenas.map((dezena, i) => (
                                                            <span key={i} className="w-7 h-7 bg-lottery-primary/10 text-lottery-primary rounded-full flex items-center justify-center text-xs font-black border border-lottery-primary/20">
                                                                {dezena}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between md:justify-end gap-6 text-right">
                                                <div className="hidden sm:block">
                                                    <p className="text-[10px] uppercase font-bold text-gray-400">Prêmio Principal</p>
                                                    <p className={`text-sm font-bold ${concurso.acumulado ? 'text-gray-400' : 'text-lottery-primary'}`}>
                                                        {concurso.acumulado ? 'Acumulado' : 'Realizado'}
                                                    </p>
                                                </div>
                                                <ChevronRight className={`text-gray-300 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                            </div>
                                        </div>

                                        {/* Expanded Details */}
                                        {isExpanded && (
                                            <div className="p-4 md:p-5 border-t border-gray-100 bg-gray-50/50 animate-in slide-in-from-top-2 duration-200">
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                    {concurso.premiacoes && concurso.premiacoes.length > 0 ? (
                                                        concurso.premiacoes.slice(0, 3).map((premio, idx) => (
                                                            <div key={idx} className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center text-center">
                                                                <span className="text-xs font-bold text-gray-500 uppercase mb-1">{premio.descricao}</span>
                                                                <span className={`text-lg font-black ${idx === 0 && !concurso.acumulado ? 'text-lottery-primary' : 'text-gray-700'}`}>
                                                                    {premio.valorPremio ? premio.valorPremio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00'}
                                                                </span>
                                                                <span className="text-xs text-gray-400 font-medium mt-1">
                                                                    {premio.ganhadores} ganhador{premio.ganhadores !== 1 ? 'es' : ''}
                                                                </span>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="col-span-3 text-center text-gray-500 py-2 text-sm">
                                                            Detalhes da premiação não disponíveis.
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        ) : (
                            <div className="bg-white p-12 rounded-3xl text-center border-2 border-dashed border-gray-100 space-y-3">
                                <AlertCircle className="w-12 h-12 text-gray-300 mx-auto" />
                                <p className="text-gray-500 font-medium">Nenhum concurso encontrado para "{searchTerm}"</p>
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="text-lottery-primary text-sm font-bold hover:underline"
                                >
                                    Limpar filtro
                                </button>
                            </div>
                        )}
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="bg-gray-100 py-10 px-4 mt-auto border-t border-gray-200">
                <div className="max-w-4xl mx-auto text-center space-y-4">
                    <div className="flex items-center justify-center gap-2 opacity-50 grayscale">
                        <div className="w-8 h-8 rounded-full bg-lottery-dark"></div>
                        <span className="font-bold text-gray-600">{selectedLottery.name}</span>
                    </div>
                    <p className="text-gray-400 text-sm">
                        Portal não oficial para consulta de resultados. <br className="md:hidden" />
                        Sempre confira os resultados oficial no site da Caixa.
                    </p>
                </div>
            </footer>
        </div>
    );
}

export default App;
