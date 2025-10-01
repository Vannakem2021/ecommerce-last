// Mock for query-string module to avoid ESM issues in Jest
module.exports = {
  parse: (str) => {
    const params = new URLSearchParams(str);
    const result = {};
    for (const [key, value] of params) {
      result[key] = value;
    }
    return result;
  },
  stringify: (obj) => {
    return new URLSearchParams(obj).toString();
  },
};
