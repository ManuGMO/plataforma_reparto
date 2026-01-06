const revoked = new Set();

export const add = (token) => {
  if (!token) return;
  revoked.add(token);
};

export const has = (token) => {
  if (!token) return false;
  return revoked.has(token);
};

export const clear = () => revoked.clear();

export default { add, has, clear };
