// Função para converter BigInt para string ou número, conforme necessário
const convertBigInt = (data) => {
    // Verifica se o valor é um BigInt
    if (typeof data === 'bigint' || data instanceof BigInt) {
        return data.toString(); // Converte BigInt para string
    }
    
    // Se for um array, mapeia cada elemento
    if (Array.isArray(data)) {
        return data.map(convertBigInt);
    }
    
    // Se for um objeto, converte recursivamente cada propriedade
    if (data !== null && typeof data === 'object') {
        const converted = {};
        for (const key in data) {
            if (data.hasOwnProperty(key)) {
                converted[key] = convertBigInt(data[key]);
            }
        }
        return converted;
    }
    
    // Retorna o valor inalterado se não for BigInt, array ou objeto
    return data;
};

module.exports = convertBigInt;