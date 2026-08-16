import test from 'node:test';
import assert from 'node:assert/strict';

await import('../../../frontend/static/misionemprende/js/word-search-generator.js');

const words = ['INNOVAR', 'EQUIPO', 'LIDER', 'EMPATIA', 'CLIENTE', 'PROBLEMA', 'SOLUCION', 'PITCH', 'VALOR', 'MERCADO'];

test('la sopa reserva celdas exclusivas para cada palabra', () => {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const { grid, locations } = globalThis.WordSearchGenerator.generate({ size: 15, words });
    const occupied = new Set();
    for (const word of words) {
      const indices = locations[word];
      assert.equal(indices.length, word.length);
      assert.equal(indices.map((index) => grid[index]).join(''), word);
      indices.forEach((index) => {
        assert.equal(occupied.has(index), false, `la celda ${index} se solapó`);
        occupied.add(index);
      });
    }
  }
});
