export default function banner () {
  return {
    name: 'banner',
    renderChunk (code, chunk) {
      return chunk.name === 'urql-next' ? `"use client"\n\n${code}` : code
    }
  }
}
