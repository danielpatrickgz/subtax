const stylePresets = {
  classic: {
    id: 'classic',
    name: 'Classic',
    fontFamily: 'Arial',
    fontColor: '#FFFFFF',
    highlightColor: '#FFFFFF',
    backgroundColor: 'transparent',
    outlineColor: '#000000',
    position: 'bottom',
    animation: 'none'
  },
  modern: {
    id: 'modern',
    name: 'Modern Creator',
    fontFamily: 'Montserrat',
    fontColor: '#FFFFFF',
    highlightColor: '#FFD60A',
    backgroundColor: '#00000088',
    outlineColor: '#000000',
    position: 'center',
    animation: 'word-pop'
  },
  minimal: {
    id: 'minimal',
    name: 'Minimal Clean',
    fontFamily: 'Inter',
    fontColor: '#F8FAFC',
    highlightColor: '#93C5FD',
    backgroundColor: '#0F172A66',
    outlineColor: '#0F172A',
    position: 'bottom',
    animation: 'fade'
  }
};

module.exports = { stylePresets };
