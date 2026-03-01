/**
 * Handle IE not supporting new ImageData()
 */
export default (() => {
    try {
        new ImageData(1, 1);
        return (width, height) => new ImageData(width, height);
    } catch (e) {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext('2d');
        return (width, height) => ctx.createImageData(width, height);
    }
})();