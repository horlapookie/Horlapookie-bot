
import translatte from 'translatte';

async function traduire(text, options) {
  try {
    const result = await translatte(text, options);
    return result.text;
  } catch (error) {
    throw error;
  }
}

export default traduire;
