function convertBigInt(obj) {
    if (Array.isArray(obj)) {
      return obj.map(convertBigInt);
    } else if (obj !== null && typeof obj === 'object') {
      return Object.fromEntries(
        Object.entries(obj).map(([key, value]) => [key, convertBigInt(value)])
      );
    } else if (typeof obj === 'bigint') {
      return Number(obj); // ou: value.toString()
    } else {
      return obj;
    }
  }

  // Função para converter BigInt para string ou número, conforme necessário
const convertBigInt = (data) => {
    if (data instanceof BigInt) {
      return data.toString(); // Converte BigInt para string
    }
  
    if (Array.isArray(data)) {
      return data.map(convertBigInt); // Aplica recursivamente em arrays
    }
  
    if (data && typeof data === 'object') {
      const converted = {};
      for (const key in data) {
        if (data.hasOwnProperty(key)) {
          converted[key] = convertBigInt(data[key]); // Aplica recursivamente em objetos
        }
      }
      return converted;
    }
  
    return data; // Retorna valor sem modificações se não for BigInt
  };
  
  module.exports = convertBigInt;
  