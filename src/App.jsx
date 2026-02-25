import React, { useState, useEffect } from 'react';
import { Calendar, Trophy, ChevronRight, RefreshCw, AlertCircle } from 'lucide-react';

const MEGA_SENA_API = 'https://loteriascaixa-api.herokuapp.com/api/megasena';
const MEGA_SENA_API_SECONDARY = 'https://lottolookup.com.br/api/megasena';
const MEGA_SENA_API_OFFICIAL = '/caixa-api';

function App() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [suggestion, setSuggestion] = useState(null);

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
        while (selected.size < 4 && hotNumbers.length >= 4) {
            const index = Math.floor(Math.random() * hotNumbers.length);
            selected.add(hotNumbers[index]);
        }

        // Completa com números aleatórios (1-60) até ter 6
        while (selected.size < 6) {
            const randomNum = Math.floor(Math.random() * 60) + 1;
            selected.add(randomNum);
        }

        setSuggestion(Array.from(selected).sort((a, b) => a - b));
    };

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            // Fetch from multiple APIs in parallel
            const [resOff, res1, res2] = await Promise.allSettled([
                fetch(MEGA_SENA_API_OFFICIAL).then(r => r.ok ? r.json() : null).catch(() => null),
                fetch(MEGA_SENA_API).then(r => r.ok ? r.json() : null).catch(() => null),
                fetch(MEGA_SENA_API_SECONDARY).then(r => r.ok ? r.json() : null).catch(() => null)
            ]);

            const resultsOfficial = resOff.status === 'fulfilled' && resOff.value ? [resOff.value] : [];
            const results1 = res1.status === 'fulfilled' && res1.value ? res1.value : [];
            const results2 = res2.status === 'fulfilled' && res2.value ? Object.values(res2.value) : [];

            console.log('API Sources Status:', {
                official: resultsOfficial.length > 0,
                heroku: results1.length > 0,
                lottolookup: results2.length > 0
            });

            if (resultsOfficial.length === 0 && results1.length === 0 && results2.length === 0) {
                throw new Error('Falha ao buscar dados de todas as fontes');
            }

            // Map and Merge results
            const mapHeroku = (item) => ({
                numero: item.concurso,
                dataApuracao: item.data,
                listaDezenas: item.dezenas,
                acumulado: item.acumulou,
                dataProximoConcurso: item.dataProximoConcurso,
                valorEstimadoProximoConcurso: item.valorEstimadoProximoConcurso
            });

            const mapInternal = (item) => ({
                numero: item.numero,
                dataApuracao: item.dataApuracao,
                listaDezenas: item.listaDezenas,
                acumulado: item.acumulado,
                dataProximoConcurso: item.dataProximoConcurso,
                valorEstimadoProximoConcurso: item.valorEstimadoProximoConcurso
            });

            const mergedMap = new Map();

            // Process Official (most up-to-date)
            resultsOfficial.forEach(item => {
                const mapped = mapInternal(item);
                mergedMap.set(mapped.numero, mapped);
            });

            // Process Lottolookup
            results2.forEach(item => {
                if (!mergedMap.has(item.numero)) {
                    mergedMap.set(item.numero, mapInternal(item));
                }
            });

            // Process Heroku
            results1.forEach(item => {
                if (!mergedMap.has(item.concurso)) {
                    mergedMap.set(item.concurso, mapHeroku(item));
                }
            });

            // Convert to array and sort by number descending
            const finalData = Array.from(mergedMap.values())
                .sort((a, b) => b.numero - a.numero);

            setData(finalData);
        } catch (err) {
            setError('Ocorreu um erro ao carregar os resultados. Por favor, tente novamente mais tarde.');
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

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
                    <RefreshCw className="w-12 h-12 text-megasena-green animate-spin" />
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
                        className="bg-megasena-green hover:bg-megasena-green-dark text-white font-bold py-3 px-8 rounded-full transition-all flex items-center gap-2 mx-auto"
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
            <header className="bg-megasena-green-dark text-white py-6 px-4 shadow-lg sticky top-0 z-10">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="bg-white p-1 rounded-full">
                            <div className="w-8 h-8 rounded-full border-4 border-megasena-green flex items-center justify-center text-megasena-green font-black">M</div>
                        </div>
                        <h1 className="text-2xl font-black italic tracking-tighter">MEGA-SENA</h1>
                    </div>
                    <button onClick={fetchData} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <RefreshCw className="w-6 h-6" />
                    </button>
                </div>
            </header>

            <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-6 space-y-8">
                {/* Latest Result Card */}
                {latest && (
                    <section className="bg-white rounded-3xl overflow-hidden shadow-2xl border border-gray-100">
                        <div className="bg-megasena-green p-6 text-white text-center relative overflow-hidden">
                            {/* Decorative circles */}
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full"></div>
                            <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-white/5 rounded-full"></div>

                            <p className="uppercase tracking-widest text-sm font-bold opacity-80 mb-1">Último Resultado</p>
                            <h2 className="text-4xl font-black mb-1">Concurso {latest.numero}</h2>
                            <div className="flex items-center justify-center gap-2 opacity-90 text-sm">
                                <Calendar className="w-4 h-4" />
                                <span>{latest.dataApuracao}</span>
                            </div>
                        </div>

                        <div className="p-8 space-y-8">
                            {/* Dezenas */}
                            <div className="flex flex-wrap justify-center gap-3 md:gap-5">
                                {latest.listaDezenas.map((dezena, idx) => (
                                    <div
                                        key={idx}
                                        className="w-14 h-14 md:w-20 md:h-20 bg-megasena-green text-white rounded-full flex items-center justify-center text-2xl md:text-4xl font-black shadow-lg border-4 border-white transform hover:scale-110 transition-transform cursor-default"
                                    >
                                        {dezena}
                                    </div>
                                ))}
                            </div>

                            {/* Status and Next Prize */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                                <div className={`p-6 rounded-2xl flex flex-col items-center justify-center text-center ${latest.acumulado ? 'bg-yellow-50 border border-yellow-100' : 'bg-green-50 border border-green-100'}`}>
                                    <Trophy className={`w-10 h-10 mb-2 ${latest.acumulado ? 'text-yellow-600' : 'text-megasena-green'}`} />
                                    <p className="text-sm font-bold text-gray-500 uppercase">Resultado</p>
                                    <p className={`text-xl font-black ${latest.acumulado ? 'text-yellow-700' : 'text-megasena-green'}`}>
                                        {latest.acumulado ? 'ACUMULOU!' : 'SAIU O PRÊMIO!'}
                                    </p>
                                </div>

                                <div className="p-6 rounded-2xl bg-megasena-green/5 border border-megasena-green/10 flex flex-col items-center justify-center text-center">
                                    <p className="text-sm font-bold text-gray-500 uppercase">Próximo Concurso</p>
                                    <p className="text-3xl font-black text-megasena-green-dark">
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
                    <div className="absolute top-0 right-0 w-32 h-32 bg-megasena-green/5 rounded-bl-full -z-0"></div>

                    <div className="relative z-10">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                            <div>
                                <h3 className="text-xl font-black text-gray-800 flex items-center gap-2">
                                    <Trophy className="w-6 h-6 text-megasena-green" />
                                    Gerador de Palpites
                                </h3>
                                <p className="text-sm text-gray-500 font-medium">Sugerindo números com base na frequência dos últimos 20 sorteios</p>
                            </div>
                            <button
                                onClick={generateSuggestion}
                                className="bg-megasena-green hover:bg-megasena-green-dark text-white font-bold py-3 px-6 rounded-2xl transition-all shadow-lg hover:shadow-megasena-green/20 flex items-center justify-center gap-2 active:scale-95"
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
                                        className="w-12 h-12 md:w-16 md:h-16 bg-white border-4 border-megasena-green text-megasena-green rounded-full flex items-center justify-center text-xl md:text-2xl font-black shadow-md"
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
                                <RefreshCw className={`w-4 h-4 text-gray-400 group-focus-within:text-megasena-green transition-colors ${loading ? 'animate-spin' : ''}`} />
                            </div>
                            <input
                                type="text"
                                placeholder="Filtrar por concurso ou data..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-megasena-green/20 focus:border-megasena-green sm:text-sm transition-all shadow-sm"
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        {filteredHistory.length > 0 ? (
                            filteredHistory.map((concurso) => (
                                <div
                                    key={concurso.numero}
                                    className="bg-white p-4 md:p-5 rounded-2xl shadow hover:shadow-md transition-shadow border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4"
                                >
                                    <div className="flex items-center justify-between md:justify-start gap-4">
                                        <div className="bg-gray-100 px-3 py-1 rounded-lg">
                                            <span className="text-xs font-bold text-gray-400 uppercase leading-none block">Nº</span>
                                            <span className="text-lg font-black text-gray-700">{concurso.numero}</span>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-1 text-xs text-gray-400 font-bold mb-1">
                                                <Calendar className="w-3 h-3" /> {concurso.dataApuracao}
                                            </div>
                                            <div className="flex gap-1.5">
                                                {concurso.listaDezenas.map((dezena, i) => (
                                                    <span key={i} className="w-7 h-7 bg-megasena-green/10 text-megasena-green rounded-full flex items-center justify-center text-xs font-black border border-megasena-green/20">
                                                        {dezena}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between md:justify-end gap-6 text-right">
                                        <div className="hidden sm:block">
                                            <p className="text-[10px] uppercase font-bold text-gray-400">Prêmio Principal</p>
                                            <p className={`text-sm font-bold ${concurso.acumulado ? 'text-gray-400' : 'text-megasena-green'}`}>
                                                {concurso.acumulado ? 'Acumulado' : 'Realizado'}
                                            </p>
                                        </div>
                                        <ChevronRight className="text-gray-300" />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="bg-white p-12 rounded-3xl text-center border-2 border-dashed border-gray-100 space-y-3">
                                <AlertCircle className="w-12 h-12 text-gray-300 mx-auto" />
                                <p className="text-gray-500 font-medium">Nenhum concurso encontrado para "{searchTerm}"</p>
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="text-megasena-green text-sm font-bold hover:underline"
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
                        <div className="w-8 h-8 rounded-full bg-megasena-green-dark"></div>
                        <span className="font-bold text-gray-600">MEGA-SENA</span>
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
