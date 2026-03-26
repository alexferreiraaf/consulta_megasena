export const LOTTERIES = {
  megasena: {
    id: 'megasena',
    name: 'MEGA-SENA',
    label: 'M',
    apiEndpoint: 'https://loteriascaixa-api.herokuapp.com/api/megasena',
    color: '#209869',
    colorDark: '#006b3f',
    colorLight: '#b5db61',
    rules: {
      min: 1,
      max: 60,
      balls: 6
    }
  },
  lotofacil: {
    id: 'lotofacil',
    name: 'LOTOFÁCIL',
    label: 'LF',
    apiEndpoint: 'https://loteriascaixa-api.herokuapp.com/api/lotofacil',
    color: '#930089',
    colorDark: '#5e0058',
    colorLight: '#d600c2',
    rules: {
      min: 1,
      max: 25,
      balls: 15
    }
  },
  quina: {
    id: 'quina',
    name: 'QUINA',
    label: 'Q',
    apiEndpoint: 'https://loteriascaixa-api.herokuapp.com/api/quina',
    color: '#260085',
    colorDark: '#1d0061',
    colorLight: '#3f00cc',
    rules: {
      min: 1,
      max: 80,
      balls: 5
    }
  },
  lotomania: {
    id: 'lotomania',
    name: 'LOTOMANIA',
    label: 'LM',
    apiEndpoint: 'https://loteriascaixa-api.herokuapp.com/api/lotomania',
    color: '#f78100',
    colorDark: '#c76800',
    colorLight: '#ffb347',
    rules: {
      min: 0,
      max: 99,
      balls: 20
    }
  }
};
