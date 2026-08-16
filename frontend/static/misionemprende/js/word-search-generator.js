(function (root) {
    const shuffle = (values, random) => {
        const result = [...values];
        for (let i = result.length - 1; i > 0; i -= 1) {
            const j = Math.floor(random() * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    };

    function generate({ size = 15, words, random = Math.random, fill = 'BCDFGHJKNPQRSTVWXYZ' }) {
        const normalized = [...new Set((words || []).map(word => String(word).trim().toUpperCase()).filter(Boolean))]
            .sort((a, b) => b.length - a.length || a.localeCompare(b));
        if (!Number.isInteger(size) || size < 2) throw new Error('El tamaño de la sopa es inválido');
        if (!normalized.length || normalized.some(word => word.length > size)) throw new Error('Las palabras no caben en la sopa');

        const grid = new Array(size * size).fill('');
        const locations = {};
        const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];

        const placementsFor = (word) => {
            const placements = [];
            for (const [dr, dc] of directions) {
                for (let row = 0; row < size; row += 1) {
                    for (let col = 0; col < size; col += 1) {
                        const endRow = row + dr * (word.length - 1);
                        const endCol = col + dc * (word.length - 1);
                        if (endRow < 0 || endRow >= size || endCol < 0 || endCol >= size) continue;
                        placements.push(Array.from({ length: word.length }, (_, index) => (row + dr * index) * size + col + dc * index));
                    }
                }
            }
            return shuffle(placements, random);
        };

        const place = (wordIndex) => {
            if (wordIndex === normalized.length) return true;
            const word = normalized[wordIndex];
            for (const indices of placementsFor(word)) {
                // Celdas estrictamente exclusivas: ni siquiera letras iguales de
                // palabras distintas pueden compartir una posición.
                if (indices.some(index => grid[index] !== '')) continue;
                indices.forEach((index, offset) => { grid[index] = word[offset]; });
                locations[word] = indices;
                if (place(wordIndex + 1)) return true;
                indices.forEach(index => { grid[index] = ''; });
                delete locations[word];
            }
            return false;
        };

        if (!place(0)) throw new Error('No se pudo generar una sopa de letras sin solapamientos');
        grid.forEach((letter, index) => {
            if (!letter) grid[index] = fill[Math.floor(random() * fill.length)];
        });
        return { grid, locations };
    }

    root.WordSearchGenerator = { generate };
})(typeof window === 'undefined' ? globalThis : window);
